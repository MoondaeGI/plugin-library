import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'design-iconset', 'scripts', 'build-iconset-sheet.mjs');

// 아이콘 폴더 + 선택적 tokens.json 을 tmp 에 만들고 스크립트 실행
function setup(svgs, tokens) {
  const d = mkdtempSync(path.join(tmpdir(), 'is-'));
  const iconDir = path.join(d, 'icon');
  mkdirSync(iconDir);
  for (const [name, content] of Object.entries(svgs)) writeFileSync(path.join(iconDir, name), content, 'utf8');
  const outPath = path.join(d, 'iconset-sheet.html');
  const argv = [SCRIPT, '--in', iconDir, '--out', outPath, '--brand', 'MODO'];
  if (tokens) {
    const tp = path.join(d, 'brand-tokens.json');
    writeFileSync(tp, JSON.stringify(tokens), 'utf8');
    argv.push('--tokens', tp);
  }
  const res = spawnSync('node', argv, { encoding: 'utf8' });
  return { res, outPath, iconDir };
}

const SVG = (extra = '') => `<svg ${extra}viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16"/></svg>`;

test('N개 SVG → N개 셀 + 치환 안 된 토큰 없음', () => {
  const { res, outPath } = setup({ 'search.svg': SVG(), 'add.svg': SVG(), 'close.svg': SVG() });
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(outPath, 'utf8');
  assert.equal((html.match(/class="cell"/g) || []).length, 3);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
});

test('번호는 파일명 정렬 + 01.. zero-pad', () => {
  const { outPath } = setup({ 'z-last.svg': SVG(), 'a-first.svg': SVG(), 'm-mid.svg': SVG() });
  const html = readFileSync(outPath, 'utf8');
  assert.ok(html.indexOf('a-first') < html.indexOf('m-mid'));
  assert.ok(html.indexOf('m-mid') < html.indexOf('z-last'));
  assert.match(html, /class="idx">01</);
  assert.match(html, /class="idx">03</);
});

test('라벨 = .svg 제거한 파일명', () => {
  const { outPath } = setup({ 'leak-detection.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /class="label">leak-detection/);
});

test('SVG 는 인라인 임베드 (img src 아님)', () => {
  const { outPath } = setup({ 'search.svg': SVG() });
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /<svg[^>]*viewBox="0 0 24 24"/);
  assert.doesNotMatch(html, /<img[^>]*\.svg/);
});

test('루트 <svg> 의 width/height 제거 (viewBox 유지)', () => {
  const { outPath } = setup({ 'x.svg': SVG('width="999" height="999" ') });
  const html = readFileSync(outPath, 'utf8');
  assert.doesNotMatch(html, /999/);
  assert.match(html, /viewBox="0 0 24 24"/);
});

test('결정적 — 같은 입력 두 번 → 바이트 동일', () => {
  const svgs = { 'a.svg': SVG(), 'b.svg': SVG() };
  const r1 = setup(svgs); const r2 = setup(svgs);
  assert.equal(readFileSync(r1.outPath, 'utf8'), readFileSync(r2.outPath, 'utf8'));
});

test('tokens 있으면 캔버스/잉크/액센트 색 적용', () => {
  const { outPath } = setup({ 'a.svg': SVG() },
    { color: { background: '#0B0F14', text: '#E6EDF3', accent: '#14B8A6' } });
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /--canvas:#0B0F14/);
  assert.match(html, /--ink:#E6EDF3/);
  assert.match(html, /--accent:#14B8A6/);
});

test('tokens 없으면 기본색', () => {
  const { outPath } = setup({ 'a.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /--canvas:#ffffff/);
});

test('SVG 0개 → 종료코드 2', () => {
  const { res } = setup({ 'readme.txt': 'not an svg' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /SVG/);
});

test('.svg 인데 내용이 SVG 아니면 종료코드 2 + 파일명', () => {
  const { res } = setup({ 'broken.svg': 'just text' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /broken\.svg/);
});

test('--in 디렉터리 없음 → 종료코드 2', () => {
  const res = spawnSync('node', [SCRIPT, '--in', path.join(tmpdir(), 'nope-xyz'), '--out', path.join(tmpdir(), 'o.html')], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('인자 없이 → 종료코드 2 + usage', () => {
  const res = spawnSync('node', [SCRIPT], { encoding: 'utf8' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /--in/);
});

test('값 없는 플래그(--in 만) → 종료코드 2', () => {
  const res = spawnSync('node', [SCRIPT, '--in'], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('HTML 특수문자 라벨 이스케이프', () => {
  const { outPath } = setup({ 'a&b.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /a&amp;b/);
});

test('잘못된 --tokens JSON → 종료코드 2', () => {
  const d = mkdtempSync(path.join(tmpdir(), 'is-'));
  const iconDir = path.join(d, 'icon');
  mkdirSync(iconDir);
  writeFileSync(path.join(iconDir, 'a.svg'), SVG(), 'utf8');
  const tp = path.join(d, 'brand-tokens.json');
  writeFileSync(tp, '{ not json', 'utf8');
  const outPath = path.join(d, 'out.html');
  const res = spawnSync('node', [SCRIPT, '--in', iconDir, '--out', outPath, '--tokens', tp], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test("루트 <svg> 의 single-quote width/height 도 제거", () => {
  const { outPath } = setup({ 'q.svg': `<svg width='888' height='888' viewBox="0 0 24 24"><path d="M4 4h16"/></svg>` });
  const html = readFileSync(outPath, 'utf8');
  assert.doesNotMatch(html, /888/);
  assert.match(html, /viewBox="0 0 24 24"/);
});
