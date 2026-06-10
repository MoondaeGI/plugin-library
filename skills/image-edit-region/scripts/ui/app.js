// 드래그(사각형)·브러시 영역 편집 GUI. 순수함수는 node 테스트가 import 하고, DOM 바인딩은 window 가드 뒤.

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

export function buildEditPayload(bbox, prompt) { return { bbox, prompt }; }
export function buildBrushPayload(maskPng, prompt) { return { maskPng, prompt }; }

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const promptEl = $('prompt'), statusEl = $('status'), afterEl = $('after');
  const bboxHintEl = $('bboxhint'), afterHintEl = $('afterhint');
  const editBtn = $('edit'), confirmBtn = $('confirm'), redoBtn = $('redo'), cancelBtn = $('cancel');
  const overlay = $('overlay'), overlayLabel = $('overlay-label'), overlaySub = $('overlay-sub');
  const toolRectBtn = $('tool-rect'), toolBrushBtn = $('tool-brush');
  const brushCtl = $('brushctl'), sizeEl = $('brushsize'), eraseEl = $('erase'), clearBtn = $('clearmask');

  const img = new Image();
  let imageW = 0, imageH = 0, rect = null, dragging = false, lastPreviewId = null;
  let tool = 'rect';            // 'rect' | 'brush'
  let painting = false, painted = false, lastPt = null;
  // 마스크 캔버스(원본 해상도)=데이터. 오버레이 캔버스=마스크에서 도출한 화면 강조(WYSIWYG).
  const maskCv = document.createElement('canvas'), maskCtx = maskCv.getContext('2d');
  const ovCv = document.createElement('canvas'), ovCtx = ovCv.getContext('2d');

  const setStatus = (m, type = '') => { statusEl.textContent = m; statusEl.className = type; };
  const showOverlay = (label, sub) => { overlayLabel.textContent = label; overlaySub.textContent = sub || ''; overlay.hidden = false; };
  const hideOverlay = () => { overlay.hidden = true; };

  const qp = new URLSearchParams(location.search).get('prompt');
  if (qp) promptEl.value = qp;

  img.onload = () => {
    imageW = img.naturalWidth; imageH = img.naturalHeight;
    const scale = Math.min(1, 720 / imageW);
    cv.width = Math.round(imageW * scale); cv.height = Math.round(imageH * scale);
    maskCv.width = imageW; maskCv.height = imageH;
    ovCv.width = imageW; ovCv.height = imageH;
    resetMask();
    draw();
  };
  img.src = '/image';

  // 마스크 초기화: 전체 불투명 검정(보존).
  function resetMask() {
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = '#000'; maskCtx.fillRect(0, 0, imageW, imageH);
    painted = false;
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (tool === 'brush') {
      // 보존 영역(편집 안 할 곳)만 어둡게 덮어 편집 영역을 또렷이(사각형 모드와 동일한 강조).
      // ov = 어두운 전체 × maskAlpha → 보존(alpha255)만 어둡고 편집(alpha0)은 투명.
      ovCtx.globalCompositeOperation = 'source-over';
      ovCtx.clearRect(0, 0, imageW, imageH);
      ovCtx.fillStyle = 'rgba(10,12,16,.5)'; ovCtx.fillRect(0, 0, imageW, imageH);
      ovCtx.globalCompositeOperation = 'destination-in';
      ovCtx.drawImage(maskCv, 0, 0);
      ctx.drawImage(ovCv, 0, 0, cv.width, cv.height);
    } else if (rect) {
      const x = Math.min(rect.x0, rect.x1), y = Math.min(rect.y0, rect.y1);
      const w = Math.abs(rect.x1 - rect.x0), h = Math.abs(rect.y1 - rect.y0);
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

  // 표시 좌표 → 내부 캔버스 해상도(사각형용).
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  // 표시 좌표 → 원본 픽셀(브러시용).
  const posImage = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (imageW / r.width), y: (e.clientY - r.top) * (imageH / r.height) };
  };

  function updateBboxHint() {
    if (tool === 'brush') { bboxHintEl.textContent = '브러시로 바꿀 영역을 칠하세요. 지우개로 지울 수 있어요.'; return; }
    if (!rect) { bboxHintEl.textContent = '이미지를 드래그해 편집할 영역을 지정하세요.'; return; }
    const b = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    bboxHintEl.innerHTML = `선택: <b>${b.w}×${b.h}px</b> @ (${b.x}, ${b.y}) · 원본 픽셀 기준`;
  }

  // 솔리드 브러시 한 획: from→to 를 꽉 찬 둥근 선으로. 칠=destination-out 으로 alpha 0(편집),
  // 지우개=검정 source-over 로 보존(255) 복원. 이음새 페더는 서버에서 작은 고정폭으로 처리.
  function stroke(from, to) {
    const r = Math.max(1, Number(sizeEl.value));
    maskCtx.globalCompositeOperation = eraseEl.checked ? 'source-over' : 'destination-out';
    maskCtx.fillStyle = '#000'; maskCtx.strokeStyle = '#000';
    maskCtx.lineWidth = r * 2; maskCtx.lineCap = 'round'; maskCtx.lineJoin = 'round';
    maskCtx.beginPath(); maskCtx.moveTo(from.x, from.y); maskCtx.lineTo(to.x, to.y); maskCtx.stroke();
    maskCtx.beginPath(); maskCtx.arc(to.x, to.y, r, 0, Math.PI * 2); maskCtx.fill();
    if (!eraseEl.checked) painted = true;
  }

  // 포인터: 사각형(rect) 모드와 브러시 모드 공용 진입점.
  cv.addEventListener('mousedown', (e) => {
    if (tool === 'brush') { painting = true; lastPt = posImage(e); stroke(lastPt, lastPt); draw(); }
    else { const p = pos(e); rect = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; dragging = true; }
  });
  cv.addEventListener('mousemove', (e) => {
    if (tool === 'brush') { if (!painting) return; const p = posImage(e); stroke(lastPt, p); lastPt = p; draw(); }
    else { if (!dragging) return; const p = pos(e); rect.x1 = p.x; rect.y1 = p.y; draw(); updateBboxHint(); }
  });
  window.addEventListener('mouseup', () => { dragging = false; painting = false; });

  function setTool(t) {
    tool = t;
    toolRectBtn.classList.toggle('active', t === 'rect');
    toolBrushBtn.classList.toggle('active', t === 'brush');
    brushCtl.style.display = t === 'brush' ? '' : 'none';
    cv.style.cursor = t === 'brush' ? 'cell' : 'crosshair';
    updateBboxHint(); draw();
  }
  toolRectBtn.onclick = () => setTool('rect');
  toolBrushBtn.onclick = () => setTool('brush');
  clearBtn.onclick = () => { resetMask(); draw(); setStatus('마스크를 비웠습니다.'); };

  async function postJson(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  editBtn.onclick = async () => {
    let payload;
    if (tool === 'brush') {
      if (!painted) return setStatus('편집할 영역을 브러시로 칠하세요.', 'err');
      payload = buildBrushPayload(maskCv.toDataURL('image/png'), promptEl.value);
    } else {
      if (!rect) return setStatus('먼저 편집할 영역을 드래그하세요.', 'err');
      const bbox = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
      if (bbox.w < 1 || bbox.h < 1) return setStatus('영역이 너무 작습니다.', 'err');
      payload = buildEditPayload(bbox, promptEl.value);
    }
    editBtn.disabled = true; redoBtn.disabled = true; confirmBtn.disabled = true;
    showOverlay('미리보기 만드는 중…', '선택 영역만 편집하고 나머지는 보존합니다');
    setStatus('편집 중…', 'busy');
    try {
      const res = await postJson('/edit', payload);
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
      // 확정·저장 완료 → 창 자동 닫기. --new-window 로 직접 연 창이라 Chrome 에서 window.close() 가 허용됨.
      // 차단되는 브라우저면 메시지가 남으니 사용자가 직접 닫으면 된다.
      setStatus('저장됨: ' + res.savedPath + ' — 창을 닫습니다…', 'ok');
      setTimeout(() => window.close(), 700);
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
  ping();
  setInterval(ping, 3000);
  window.addEventListener('pagehide', () => { try { navigator.sendBeacon('/cancel'); } catch (e) { /* 닫히는 중 실패 무시 */ } });

  setTool('rect');
}
