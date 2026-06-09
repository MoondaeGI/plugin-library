import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canvasToImageBbox, buildEditPayload } from '../../../../../skills/image-edit-region/scripts/ui/app.js';

test('canvasToImageBbox: 표시배율을 반영해 원본 픽셀 정수 bbox로 환산', () => {
  // 원본 800x600, 캔버스 400x300(0.5배). 캔버스 (100,50)~(300,250) 드래그.
  const bbox = canvasToImageBbox(
    { x0: 100, y0: 50, x1: 300, y1: 250 },
    { canvasW: 400, canvasH: 300, imageW: 800, imageH: 600 },
  );
  assert.deepEqual(bbox, { x: 200, y: 100, w: 400, h: 400 });
});

test('canvasToImageBbox: 뒤집힌 드래그(우→좌)도 정규화', () => {
  const bbox = canvasToImageBbox(
    { x0: 300, y0: 250, x1: 100, y1: 50 },
    { canvasW: 400, canvasH: 300, imageW: 400, imageH: 300 },
  );
  assert.deepEqual(bbox, { x: 100, y: 50, w: 200, h: 200 });
});

test('canvasToImageBbox: 이미지 경계로 클램프', () => {
  const bbox = canvasToImageBbox(
    { x0: -10, y0: -10, x1: 410, y1: 310 },
    { canvasW: 400, canvasH: 300, imageW: 400, imageH: 300 },
  );
  assert.deepEqual(bbox, { x: 0, y: 0, w: 400, h: 300 });
});

test('buildEditPayload: bbox·prompt 를 JSON 페이로드로', () => {
  const p = buildEditPayload({ x: 1, y: 2, w: 3, h: 4 }, '빨갛게');
  assert.deepEqual(p, { bbox: { x: 1, y: 2, w: 3, h: 4 }, prompt: '빨갛게' });
});
