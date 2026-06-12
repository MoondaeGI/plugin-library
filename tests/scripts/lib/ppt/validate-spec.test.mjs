// tests/scripts/lib/ppt/validate-spec.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec, SpecValidationError, LAYOUTS } from '../../../../scripts/lib/ppt/validate-spec.mjs';

function validSpec() {
  return {
    theme: 'default-corporate',
    slides: [
      { layout: 'title', fields: { title: '2분기 실적 보고', subtitle: '경영진 보고' } },
      { layout: 'bullets', fields: { title: '핵심 요약', bullets: ['매출 12% 성장', '신규 고객 34곳'] }, notes: '한 줄 메시지' },
      { layout: 'chart', fields: { title: '월별 매출', chartType: 'bar',
          data: [{ name: '매출', labels: ['4월', '5월', '6월'], values: [120, 135, 152] }] } },
    ],
  };
}

test('유효한 스펙은 통과한다', () => {
  assert.doesNotThrow(() => validateSpec(validSpec()));
});

test('레이아웃 8종이 레지스트리에 있다', () => {
  assert.deepEqual(
    Object.keys(LAYOUTS).sort(),
    ['bullets', 'chart', 'closing', 'image', 'section', 'table', 'title', 'two-col'],
  );
});

test('필수 필드 누락 시 슬라이드 번호와 필드를 명시한다', () => {
  const spec = validSpec();
  delete spec.slides[1].fields.title;
  assert.throws(() => validateSpec(spec), (err) => {
    assert.ok(err instanceof SpecValidationError);
    assert.match(err.message, /슬라이드 2/);
    assert.match(err.message, /title/);
    return true;
  });
});

test('알 수 없는 레이아웃을 거부한다', () => {
  const spec = validSpec();
  spec.slides[0].layout = 'fancy';
  assert.throws(() => validateSpec(spec), /슬라이드 1.*fancy/);
});

test('글자 수 상한을 넘으면 거부한다', () => {
  const spec = validSpec();
  spec.slides[0].fields.title = '가'.repeat(41); // title 상한 40
  assert.throws(() => validateSpec(spec), /슬라이드 1.*title.*40/);
});

test('bullets 개수 상한(7개)을 넘으면 거부한다', () => {
  const spec = validSpec();
  spec.slides[1].fields.bullets = Array.from({ length: 8 }, (_, i) => `항목 ${i}`);
  assert.throws(() => validateSpec(spec), /슬라이드 2.*bullets.*7/);
});

test('chart의 labels/values 길이 불일치를 거부한다', () => {
  const spec = validSpec();
  spec.slides[2].fields.data[0].values = [120, 135];
  assert.throws(() => validateSpec(spec), /슬라이드 3.*labels.*values/);
});

test('table의 행 길이가 columns와 다르면 거부한다', () => {
  const spec = validSpec();
  spec.slides.push({ layout: 'table', fields: { title: '비교', columns: ['항목', '값'], rows: [['속도', '빠름', '여분']] } });
  assert.throws(() => validateSpec(spec), /슬라이드 4.*rows\[0\]/);
});

test('slides가 비어 있으면 거부한다', () => {
  assert.throws(() => validateSpec({ theme: 'x', slides: [] }), /slides/);
});

test('검증은 원본 스펙을 변경하지 않는다', () => {
  const spec = validSpec();
  const snapshot = JSON.stringify(spec);
  validateSpec(spec);
  assert.equal(JSON.stringify(spec), snapshot);
});

test('two-col 레이아웃의 5개 필수 필드를 검증한다', () => {
  const ok = {
    theme: 'default-corporate',
    slides: [{ layout: 'two-col', fields: {
      title: '비교', leftTitle: '현행', leftBullets: ['느림'],
      rightTitle: '개선', rightBullets: ['빠름'] } }],
  };
  assert.doesNotThrow(() => validateSpec(ok));
  const missing = JSON.parse(JSON.stringify(ok));
  delete missing.slides[0].fields.rightBullets;
  assert.throws(() => validateSpec(missing), /슬라이드 1.*rightBullets/);
});

test('image 레이아웃은 path가 필수이고 빈 문자열을 거부한다', () => {
  const ok = { theme: 'default-corporate', slides: [{ layout: 'image', fields: { path: 'chart.png', caption: '4분기' } }] };
  assert.doesNotThrow(() => validateSpec(ok));
  const empty = { theme: 'default-corporate', slides: [{ layout: 'image', fields: { path: '   ' } }] };
  assert.throws(() => validateSpec(empty), /슬라이드 1.*path/);
});
