import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultBrowserCandidates, resolveBrowser, parseWidths, buildScreenshotArgs, planCaptures } from '../skills/web-publisher-qa/scripts/screenshot.mjs';

test('win32 후보 목록은 Edge를 첫 번째로 둔다', () => {
  const list = defaultBrowserCandidates('win32', { 'ProgramFiles(x86)': 'C:\\PFx86', 'ProgramFiles': 'C:\\PF' });
  assert.match(list[0], /Microsoft\\Edge\\Application\\msedge\.exe$/);
  assert.ok(list.some((p) => /chrome\.exe$/.test(p)));
});

test('darwin 후보 목록은 .app 바이너리 경로를 포함한다', () => {
  const list = defaultBrowserCandidates('darwin', {});
  assert.ok(list.some((p) => p.includes('Google Chrome.app/Contents/MacOS')));
});

test('resolveBrowser는 존재하는 첫 후보를 고른다', () => {
  const candidates = ['/no/a', '/yes/b', '/yes/c'];
  const got = resolveBrowser({ candidates, exists: (p) => p.startsWith('/yes') });
  assert.equal(got, '/yes/b');
});

test('resolveBrowser는 후보가 하나도 없으면 null', () => {
  const got = resolveBrowser({ candidates: ['/no/a', '/no/b'], exists: () => false });
  assert.equal(got, null);
});

test('parseWidths: 빈 입력이면 기본값 375/768/1280', () => {
  assert.deepEqual(parseWidths([]), [375, 768, 1280]);
});

test('parseWidths: 콤마/복수 인자를 정수로 해석', () => {
  assert.deepEqual(parseWidths(['390,1440']), [390, 1440]);
  assert.deepEqual(parseWidths(['375', '768']), [375, 768]);
});

test('parseWidths: 유효한 폭이 없으면 throw', () => {
  assert.throws(() => parseWidths(['abc']), /invalid --width/);
});

test('buildScreenshotArgs: headless/screenshot/window-size/file URL 포함', () => {
  const args = buildScreenshotArgs({ htmlPath: '/tmp/page.html', outPath: '/out/page-375.png', width: 375 });
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.some((a) => a === '--screenshot=/out/page-375.png'));
  assert.ok(args.some((a) => a === '--window-size=375,1100'));
  assert.ok(args.some((a) => a.startsWith('file://') && a.endsWith('page.html')));
});

test('planCaptures: 폭마다 <base>-<width>.png 산출', () => {
  const caps = planCaptures({ htmlPath: '/tmp/index.html', outDir: '/out', widths: [375, 768] });
  assert.equal(caps.length, 2);
  assert.equal(caps[0].width, 375);
  assert.ok(caps[0].outPath.endsWith('index-375.png'));
  assert.ok(caps[1].outPath.endsWith('index-768.png'));
  assert.ok(caps[0].args.some((a) => a === '--screenshot=' + caps[0].outPath));
});
