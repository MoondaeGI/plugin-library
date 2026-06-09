import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../../../../skills/image-edit-region/scripts/server.mjs';

function deps(overrides = {}) {
  return {
    imagePath: '/tmp/orig.png',
    outPath: '/tmp/out.png',
    workDir: '/tmp/work',
    runEditCycle: async ({ quality }) => ({ outPath: `/tmp/work/preview-${quality}.png` }),
    saveFinal: async (previewBbox, prompt) => '/tmp/out.png',
    ...overrides,
  };
}

test('handleEdit: runEditCycle(low)을 부르고 previewId 를 발급', async () => {
  const s = createSession(deps());
  const r = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  assert.ok(r.previewId);
  assert.equal(s.getPreview(r.previewId).quality, 'low');
});

test('handleConfirm: saveFinal(high)을 부르고 확정 Promise 를 resolve', async () => {
  const s = createSession(deps());
  const e = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  const done = s.waitForExit();
  const r = await s.handleConfirm({ previewId: e.previewId });
  assert.equal(r.savedPath, '/tmp/out.png');
  assert.deepEqual(await done, { status: 'confirmed', path: '/tmp/out.png' });
});

test('handleConfirm: 없는 previewId 는 거부', async () => {
  const s = createSession(deps());
  await assert.rejects(s.handleConfirm({ previewId: 'nope' }), /previewId/);
});

test('handleCancel: 확정 Promise 를 cancelled 로 resolve', async () => {
  const s = createSession(deps());
  const done = s.waitForExit();
  await s.handleCancel();
  assert.deepEqual(await done, { status: 'cancelled' });
});

test('handleEdit: runEditCycle 실패는 error 응답(세션 유지)', async () => {
  const s = createSession(deps({ runEditCycle: async () => { throw new Error('boom'); } }));
  const r = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  assert.match(r.error, /boom/);
  assert.equal(s.isAlive(), true);
});

test('워치독: heartbeatMs 동안 ping 없으면 창 닫힘으로 cancel', async () => {
  let t = 0;
  const timers = [];
  const s = createSession(deps());
  const watch = s.startWatchdog({
    now: () => t,
    setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length - 1; },
    clearTimer: () => {},
  });
  const done = s.waitForExit();
  s.handlePing();          // t=0 에 ping
  t = 20_000;              // heartbeatMs(10s) 초과
  timers.forEach((x) => x.fn()); // 워치독 tick 실행
  assert.deepEqual(await done, { status: 'cancelled', reason: 'window-closed' });
  watch.stop();
});

test('워치독: 첫 ping 전에는 window-closed 로 죽지 않는다(연결 grace)', async () => {
  let t = 0;
  const timers = [];
  const s = createSession({ ...deps(), idleMs: 1_000_000, heartbeatMs: 100 });
  const watch = s.startWatchdog({
    now: () => t, setTimer: (fn) => { timers.push(fn); return 0; }, clearTimer: () => {},
  });
  t = 5_000; // heartbeat 100 을 한참 넘겼지만 ping 이 한 번도 없었음(브라우저 콜드 스타트 중)
  timers.forEach((fn) => fn());
  assert.equal(s.isAlive(), true); // 첫 연결 전이라 window-closed 미적용
  watch.stop();
});

test('워치독: 유휴 idleMs 초과면 timeout 으로 cancel', async () => {
  let t = 0;
  const timers = [];
  const s = createSession({ ...deps(), idleMs: 100, heartbeatMs: 1_000_000 });
  const watch = s.startWatchdog({
    now: () => t, setTimer: (fn) => { timers.push(fn); return 0; }, clearTimer: () => {},
  });
  const done = s.waitForExit();
  s.handlePing();
  t = 200; // idle 초과
  timers.forEach((fn) => fn());
  assert.deepEqual(await done, { status: 'cancelled', reason: 'idle-timeout' });
  watch.stop();
});
