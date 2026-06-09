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
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const promptEl = $('prompt'), statusEl = $('status'), afterEl = $('after');
  const bboxHintEl = $('bboxhint'), afterHintEl = $('afterhint');
  const editBtn = $('edit'), confirmBtn = $('confirm'), redoBtn = $('redo'), cancelBtn = $('cancel');
  const overlay = $('overlay'), overlayLabel = $('overlay-label'), overlaySub = $('overlay-sub');

  const img = new Image();
  let imageW = 0, imageH = 0, rect = null, dragging = false, lastPreviewId = null;

  const setStatus = (m, type = '') => { statusEl.textContent = m; statusEl.className = type; };
  const showOverlay = (label, sub) => { overlayLabel.textContent = label; overlaySub.textContent = sub || ''; overlay.hidden = false; };
  const hideOverlay = () => { overlay.hidden = true; };

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
      const x = Math.min(rect.x0, rect.x1), y = Math.min(rect.y0, rect.y1);
      const w = Math.abs(rect.x1 - rect.x0), h = Math.abs(rect.y1 - rect.y0);
      // 선택 밖 4영역만 어둡게(보존 영역 강조), 선택 안은 원본 그대로.
      ctx.fillStyle = 'rgba(10,12,16,.45)';
      ctx.fillRect(0, 0, cv.width, y);
      ctx.fillRect(0, y + h, cv.width, cv.height - (y + h));
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, cv.width - (x + w), h);
      ctx.strokeStyle = '#6d8cff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }

  // 표시 크기(CSS) → 내부 캔버스 해상도로 좌표 보정(좁은 칸에서 축소 표시돼도 정확).
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  function updateBboxHint() {
    if (!rect) { bboxHintEl.textContent = '이미지를 드래그해 편집할 영역을 지정하세요.'; return; }
    const b = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    bboxHintEl.innerHTML = `선택: <b>${b.w}×${b.h}px</b> @ (${b.x}, ${b.y}) · 원본 픽셀 기준`;
  }
  cv.addEventListener('mousedown', (e) => { const p = pos(e); rect = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; dragging = true; });
  cv.addEventListener('mousemove', (e) => { if (!dragging) return; const p = pos(e); rect.x1 = p.x; rect.y1 = p.y; draw(); updateBboxHint(); });
  window.addEventListener('mouseup', () => { dragging = false; });

  async function postJson(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  editBtn.onclick = async () => {
    if (!rect) return setStatus('먼저 편집할 영역을 드래그하세요.', 'err');
    const bbox = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    if (bbox.w < 1 || bbox.h < 1) return setStatus('영역이 너무 작습니다.', 'err');
    editBtn.disabled = true; redoBtn.disabled = true; confirmBtn.disabled = true;
    showOverlay('미리보기 만드는 중…', '선택 영역만 편집하고 나머지는 보존합니다');
    setStatus('편집 중…', 'busy');
    try {
      const res = await postJson('/edit', buildEditPayload(bbox, promptEl.value));
      if (res.error) { setStatus('실패: ' + res.error, 'err'); return; }
      lastPreviewId = res.previewId;
      afterEl.src = `/preview/${res.previewId}?t=${Date.now()}`; afterEl.style.display = 'block';
      afterHintEl.style.display = 'none';
      confirmBtn.disabled = false; redoBtn.disabled = false;
      setStatus('미리보기 완료 — 마음에 들면 확정 저장하세요.', 'ok');
    } catch (e) {
      setStatus('요청 실패: ' + e.message, 'err');
    } finally {
      editBtn.disabled = false; hideOverlay();
    }
  };

  confirmBtn.onclick = async () => {
    if (!lastPreviewId) return;
    editBtn.disabled = true; redoBtn.disabled = true; confirmBtn.disabled = true;
    showOverlay('고품질로 저장 중…', '한 번 더 고품질로 편집해 파일로 저장합니다');
    setStatus('저장 중…', 'busy');
    try {
      const res = await postJson('/confirm', { previewId: lastPreviewId });
      if (res.error) { setStatus('실패: ' + res.error, 'err'); confirmBtn.disabled = false; return; }
      setStatus('저장됨: ' + res.savedPath + ' — 창을 닫아도 됩니다.', 'ok');
    } catch (e) {
      setStatus('요청 실패: ' + e.message, 'err'); confirmBtn.disabled = false;
    } finally {
      editBtn.disabled = false; hideOverlay();
    }
  };

  redoBtn.onclick = () => {
    afterEl.style.display = 'none'; afterHintEl.style.display = '';
    confirmBtn.disabled = true; redoBtn.disabled = true;
    setStatus('영역·지시문을 고쳐 다시 편집하세요.');
  };
  cancelBtn.onclick = async () => { await postJson('/cancel', {}); setStatus('취소됨 — 창을 닫아도 됩니다.'); };

  const ping = () => { fetch('/ping', { method: 'POST' }).catch(() => {}); };
  ping(); // 로드 즉시 1회 — 3초 기다리지 말고 연결을 바로 등록(워치독 grace 종료)
  setInterval(ping, 3000);
  // 진짜 창/탭 닫힘은 즉시 통지(throttle 무관). beacon 은 unload 중에도 전송 보장.
  window.addEventListener('pagehide', () => { try { navigator.sendBeacon('/cancel'); } catch (e) { /* 닫히는 중 실패 무시 */ } });
}
