#!/usr/bin/env node
// node:http 의존성0 미니 서버. createSession 이 라우트 핸들러+상태를 들고,
// startServer 가 그것을 HTTP 라우팅에 연결한다(Task 8). 핸들러는 브라우저 없이 단위 테스트 가능.

// 편집 세션: 미리보기 맵 + 확정/취소 Promise + 핸들러. 워치독·HTTP는 후속 Task 에서 더한다.
export function createSession({ runEditCycle, saveFinal, idleMs = 600_000, heartbeatMs = 10_000 }) {
  const previews = new Map(); // previewId -> { bbox, prompt, quality, outPath }
  let seq = 0, alive = true, resolveExit;
  const exitPromise = new Promise((res) => { resolveExit = res; });
  function finish(result) { if (!alive) return; alive = false; resolveExit(result); }

  const session = {
    waitForExit: () => exitPromise,
    isAlive: () => alive,
    getPreview: (id) => previews.get(id),
    finish,
    async handleEdit({ bbox, prompt }) {
      try {
        const { outPath } = await runEditCycle({ bbox, prompt, quality: 'low' });
        const previewId = `p${++seq}`;
        previews.set(previewId, { bbox, prompt, quality: 'low', outPath });
        return { previewId };
      } catch (err) { return { error: err.message }; }
    },
    async handleConfirm({ previewId }) {
      const p = previews.get(previewId);
      if (!p) throw new Error(`알 수 없는 previewId: ${previewId}`);
      const savedPath = await saveFinal(p.bbox, p.prompt); // 고품질 재실행
      finish({ status: 'confirmed', path: savedPath });
      return { savedPath };
    },
    async handleCancel() { finish({ status: 'cancelled' }); return { ok: true }; },
  };
  return session;
}
