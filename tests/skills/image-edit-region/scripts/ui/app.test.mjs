import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBrushPayload, buildEditPayload, canvasToImageBbox } from '../../../../../skills/image-edit-region/scripts/ui/app.js';

test('buildBrushPayload: maskPng dataURL 과 prompt 를 묶는다', () => {
  assert.deepEqual(
    buildBrushPayload('data:image/png;base64,AAAA', '파랗게'),
    { maskPng: 'data:image/png;base64,AAAA', prompt: '파랗게' },
  );
});

test('buildEditPayload: 기존 bbox payload 회귀', () => {
  assert.deepEqual(buildEditPayload({ x:0,y:0,w:2,h:2 }, 'x'), { bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
});

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
