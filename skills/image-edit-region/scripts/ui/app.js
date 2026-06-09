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

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const promptEl = document.getElementById('prompt');
  const statusEl = document.getElementById('status');
  const afterEl = document.getElementById('after');
  const editBtn = document.getElementById('edit');
  const confirmBtn = document.getElementById('confirm');
  const redoBtn = document.getElementById('redo');
  const cancelBtn = document.getElementById('cancel');

  const img = new Image();
  let imageW = 0, imageH = 0, rect = null, dragging = false, lastPreviewId = null;
  const setStatus = (m) => { statusEl.textContent = m; };

  // 초기 prompt 는 ?prompt= 쿼리에서(결정 C: 대화 지시문 프리필)
  const qp = new URLSearchParams(location.search).get('prompt');
  if (qp) promptEl.value = qp;

  img.onload = () => {
    imageW = img.naturalWidth; imageH = img.naturalHeight;
    const scale = Math.min(1, 720 / imageW);
    cv.width = Math.round(imageW * scale); cv.height = Math.round(imageH * scale);
    draw();
  };
  img.src = '/image';

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (rect) {
      ctx.strokeStyle = '#9cf'; ctx.lineWidth = 2;
      ctx.strokeRect(Math.min(rect.x0,rect.x1), Math.min(rect.y0,rect.y1), Math.abs(rect.x1-rect.x0), Math.abs(rect.y1-rect.y0));
    }
  }
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('mousedown', (e) => { const p = pos(e); rect = { x0:p.x, y0:p.y, x1:p.x, y1:p.y }; dragging = true; });
  cv.addEventListener('mousemove', (e) => { if (!dragging) return; const p = pos(e); rect.x1 = p.x; rect.y1 = p.y; draw(); });
  window.addEventListener('mouseup', () => { dragging = false; });

  async function postJson(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  editBtn.onclick = async () => {
    if (!rect) return setStatus('먼저 영역을 드래그하세요.');
    const bbox = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    if (bbox.w < 1 || bbox.h < 1) return setStatus('영역이 너무 작습니다.');
    setStatus('편집 중(미리보기)…'); editBtn.disabled = true;
    const res = await postJson('/edit', buildEditPayload(bbox, promptEl.value));
    editBtn.disabled = false;
    if (res.error) return setStatus('실패: ' + res.error);
    lastPreviewId = res.previewId;
    afterEl.src = `/preview/${res.previewId}?t=${Date.now()}`; afterEl.style.display = 'block';
    confirmBtn.disabled = false; redoBtn.disabled = false;
    setStatus('미리보기 준비됨. 확정하거나 다시 시도하세요.');
  };
  confirmBtn.onclick = async () => {
    if (!lastPreviewId) return;
    setStatus('고품질로 저장 중…'); confirmBtn.disabled = true;
    const res = await postJson('/confirm', { previewId: lastPreviewId });
    if (res.error) { confirmBtn.disabled = false; return setStatus('실패: ' + res.error); }
    setStatus('저장됨: ' + res.savedPath + ' — 창을 닫아도 됩니다.');
  };
  redoBtn.onclick = () => { afterEl.style.display = 'none'; confirmBtn.disabled = true; redoBtn.disabled = true; setStatus('영역·지시문을 고쳐 다시 편집하세요.'); };
  cancelBtn.onclick = async () => { await postJson('/cancel', {}); setStatus('취소됨 — 창을 닫아도 됩니다.'); };

  const ping = () => { fetch('/ping', { method: 'POST' }).catch(() => {}); };
  ping(); // 로드 즉시 1회 — 3초 기다리지 말고 연결을 바로 등록(워치독 grace 종료)
  setInterval(ping, 3000);
}
