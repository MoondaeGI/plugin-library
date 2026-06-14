// tests/scripts/lib/ppt/render-deck.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderDeck, ImageNotFoundError } from '../../../../scripts/lib/ppt/render-deck.mjs';
import { SpecValidationError } from '../../../../scripts/lib/ppt/validate-spec.mjs';

const NO_ENV = path.join(tmpdir(), 'ppt-no-such.env');

function makeDeckDir(spec) {
  const dir = mkdtempSync(path.join(tmpdir(), 'deck-'));
  writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  return dir;
}

const SPEC = {
  theme: 'default-corporate',
  slides: [
    { layout: 'title', fields: { title: '렌더 스모크', subtitle: '테스트' }, notes: '발표자 노트' },
    { layout: 'bullets', fields: { title: '요약', bullets: ['하나', '둘'] } },
    { layout: 'chart', fields: { title: '추이', chartType: 'bar',
        data: [{ name: '값', labels: ['a', 'b'], values: [1, 2] }] } },
    { layout: 'table', fields: { title: '비교', columns: ['항목', '값'], rows: [['속도', '빠름']] } },
    { layout: 'closing', fields: { title: '감사합니다' } },
  ],
};

test('스펙 5장이 deck.pptx로 렌더된다 (슬라이드 수 일치)', async () => {
  const dir = makeDeckDir(SPEC);
  const out = await renderDeck(dir, { envPath: NO_ENV, env: {} });
  assert.equal(out, path.join(dir, 'deck.pptx'));
  assert.ok(existsSync(out));
  const buf = readFileSync(out).toString('latin1'); // pptx는 zip — 엔트리 이름이 평문으로 존재
  assert.ok(buf.includes('ppt/slides/slide5.xml'), '5번 슬라이드가 있어야 함');
  assert.ok(!buf.includes('ppt/slides/slide6.xml'), '6번 슬라이드는 없어야 함');
  rmSync(dir, { recursive: true, force: true });
});

test('렌더 출력 크기는 안정적이다 — 같은 스펙 2회 렌더의 바이트 길이가 같다 (크기 스모크)', async () => {
  // pptx는 zip이라 엔트리 타임스탬프 때문에 바이트 전체는 매번 달라질 수 있다.
  // 슬라이드 XML 내용 비교는 zip 해제가 필요해 여기선 길이 동일성만 스모크로 확인한다.
  const dir = makeDeckDir(SPEC);
  await renderDeck(dir, { envPath: NO_ENV, env: {} });
  const first = readFileSync(path.join(dir, 'deck.pptx'));
  await renderDeck(dir, { envPath: NO_ENV, env: {} });
  const second = readFileSync(path.join(dir, 'deck.pptx'));
  assert.equal(first.length, second.length);
  rmSync(dir, { recursive: true, force: true });
});

test('잘못된 스펙이면 SpecValidationError로 실패한다', async () => {
  const dir = makeDeckDir({ theme: 'default-corporate', slides: [{ layout: 'title', fields: {} }] });
  await assert.rejects(() => renderDeck(dir, { envPath: NO_ENV, env: {} }), SpecValidationError);
  rmSync(dir, { recursive: true, force: true });
});

test('spec.json이 없으면 안내하며 실패한다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'deck-'));
  await assert.rejects(() => renderDeck(dir, { envPath: NO_ENV, env: {} }), /spec\.json/);
  rmSync(dir, { recursive: true, force: true });
});

test('image 슬라이드의 파일이 없으면 ImageNotFoundError로 실패한다', async () => {
  const dir = makeDeckDir({
    theme: 'default-corporate',
    slides: [{ layout: 'image', fields: { path: 'no-such-image.png', title: '없는 이미지' } }],
  });
  await assert.rejects(
    () => renderDeck(dir, { envPath: NO_ENV, env: {} }),
    (err) => {
      assert.ok(err instanceof ImageNotFoundError);
      assert.match(err.message, /no-such-image\.png/);
      return true;
    },
  );
  rmSync(dir, { recursive: true, force: true });
});
