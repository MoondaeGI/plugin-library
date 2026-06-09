// 드래그 영역 편집 GUI. 순수함수는 node 테스트가 import 하고, DOM 바인딩은 window 가드 뒤.

// 캔버스 좌표 사각(뒤집힘 허용)을 원본 픽셀 정수 bbox 로 환산하고 이미지 경계로 클램프.
export function canvasToImageBbox(rect, { canvasW, canvasH, imageW, imageH }) {
  const sx = imageW / canvasW, sy = imageH / canvasH;
  let x0 = Math.min(rect.x0, rect.x1), y0 = Math.min(rect.y0, rect.y1);
  let x1 = Math.max(rect.x0, rect.x1), y1 = Math.max(rect.y0, rect.y1);
  let ix0 = Math.round(x0 * sx), iy0 = Math.round(y0 * sy);
  let ix1 = Math.round(x1 * sx), iy1 = Math.round(y1 * sy);
  ix0 = Math.max(0, Math.min(imageW, ix0)); iy0 = Math.max(0, Math.min(imageH, iy0));
  ix1 = Math.max(0, Math.min(imageW, ix1)); iy1 = Math.max(0, Math.min(imageH, iy1));
  return { x: ix0, y: iy0, w: ix1 - ix0, h: iy1 - iy0 };
}

export function buildEditPayload(bbox, prompt) {
  return { bbox, prompt };
}
