import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'design-brand-kit', 'scripts', 'build-contact-sheet.mjs');

function validData() {
  return {
    product: 'MODO',
    directions: ['a', 'b', 'c'].map((id) => ({
      id, label: `방향 ${id}`, mood: '무드', wordmark: 'MODO',
      headline: '헤드라인', body: '본문', tagline: '태그라인',
      palette: { primary: '#0E7C7B', accent: '#14B8A6', background: '#F7FAF9', surface: '#FFFFFF', text: '#0F1B1A', textMuted: '#5B6B69', border: '#E2EAE8' },
      typography: { display: '"IBM Plex Sans KR", sans-serif', body: '"Noto Sans KR", sans-serif' },
    })),
  };
}

function run(data) {
  const d = mkdtempSync(path.join(tmpdir(), 'cs-'));
  const inPath = path.join(d, 'directions.json');
  const outPath = path.join(d, 'directions.html');
  writeFileSync(inPath, JSON.stringify(data), 'utf8');
  const res = spawnSync('node', [SCRIPT, '--in', inPath, '--out', outPath], { encoding: 'utf8' });
  return { res, outPath };
}

test('유효한 3방향 → 열 3개 + 치환 안 된 토큰 없음', () => {
  const { res, outPath } = run(validData());
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(outPath, 'utf8');
  assert.equal((html.match(/class="col"/g) || []).length, 3);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
});

test('팔레트 HEX·워드마크·태그라인 렌더', () => {
  const { outPath } = run(validData());
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /#14B8A6/);
  assert.match(html, /MODO/);
  assert.match(html, /태그라인/);
});

test('매핑된 폰트는 해당 CDN <link>', () => {
  const { outPath } = run(validData());
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /IBM\+Plex\+Sans\+KR/);
  assert.match(html, /Noto\+Sans\+KR/);
});

test('미매핑 폰트 → stderr 경고 + Google 폴백 링크', () => {
  const data = validData();
  data.directions[0].typography.display = '"Made Up Font", sans-serif';
  const { res, outPath } = run(data);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stderr, /Made Up Font/);
  assert.match(readFileSync(outPath, 'utf8'), /Made\+Up\+Font/);
});

test('directions 가 3개가 아니면 종료코드 2', () => {
  const data = validData();
  data.directions.pop();
  assert.equal(run(data).res.status, 2);
});

test('필수 필드 누락이면 종료코드 2 + stderr 에 필드명', () => {
  const data = validData();
  delete data.directions[1].palette;
  const { res } = run(data);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /palette/);
});

test('인자 없이 실행 → 종료코드 2 + usage', () => {
  const res = spawnSync('node', [SCRIPT], { encoding: 'utf8' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /--in/);
});

test('값 없는 플래그(--in 만) → 종료코드 2', () => {
  const res = spawnSync('node', [SCRIPT, '--in'], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('잘못된 JSON → 종료코드 2', () => {
  const d = mkdtempSync(path.join(tmpdir(), 'cs-'));
  const inPath = path.join(d, 'directions.json');
  const outPath = path.join(d, 'out.html');
  writeFileSync(inPath, '{ not json', 'utf8');
  const res = spawnSync('node', [SCRIPT, '--in', inPath, '--out', outPath], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('HTML 특수문자가 텍스트 콘텐츠에서 이스케이프된다', () => {
  const data = validData();
  data.directions[0].headline = '보안 & <모니터링>';
  const d = mkdtempSync(path.join(tmpdir(), 'cs-'));
  const inPath = path.join(d, 'directions.json');
  const outPath = path.join(d, 'out.html');
  writeFileSync(inPath, JSON.stringify(data), 'utf8');
  const res = spawnSync('node', [SCRIPT, '--in', inPath, '--out', outPath], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /보안 &amp; &lt;모니터링&gt;/);
});
