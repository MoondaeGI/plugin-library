import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defaultBrowserCandidates, resolveBrowser, parseWidths, buildScreenshotArgs, planCaptures } from '../skills/web-publisher-qa/scripts/screenshot.mjs';

const SCRIPT = fileURLToPath(new URL('../skills/web-publisher-qa/scripts/screenshot.mjs', import.meta.url));

function runCli(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function tmpHtml() {
  const d = mkdtempSync(path.join(tmpdir(), 'wpqa-'));
  const f = path.join(d, 'index.html');
  writeFileSync(f, '<!doctype html><title>x</title>', 'utf8');
  return { d, f };
}

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

test('CLI --print-plan: 계획 JSON 출력 + exit 0', () => {
  const { d, f } = tmpHtml();
  const out = path.join(d, 'shots');
  const res = runCli([f, '--out', out, '--widths', '375,768', '--print-plan']);
  assert.equal(res.status, 0, res.stderr);
  const plan = JSON.parse(res.stdout);
  assert.deepEqual(plan.widths, [375, 768]);
  assert.equal(plan.captures.length, 2);
  assert.ok(plan.captures[0].outPath.endsWith('index-375.png'));
  rmSync(d, { recursive: true, force: true });
});

test('CLI --browser 오버라이드가 계획에 반영', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--out', path.join(d, 's'), '--browser', '/custom/brow', '--print-plan']);
  assert.equal(JSON.parse(res.stdout).browser, '/custom/brow');
  rmSync(d, { recursive: true, force: true });
});

test('CLI: html 경로 없음 → exit 2 + usage', () => {
  const res = runCli(['--print-plan']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /usage:/);
});

test('CLI: 존재하지 않는 파일 → exit 2', () => {
  const res = runCli([path.join(tmpdir(), 'nope-wpqa-xyz.html'), '--print-plan']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없/);
});

test('CLI: 알 수 없는 플래그 → exit 2', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--bogus', '--print-plan']);
  assert.equal(res.status, 2);
  rmSync(d, { recursive: true, force: true });
});

test('CLI: 잘못된 width → exit 2', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--widths', 'abc', '--print-plan']);
  assert.equal(res.status, 2);
  rmSync(d, { recursive: true, force: true });
});

test('CLI: 값 플래그 뒤에 또 다른 플래그가 오면 exit 2', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--widths', '--print-plan']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /값이 필요합니다/);
  rmSync(d, { recursive: true, force: true });
});
