#!/usr/bin/env node
// node:http 의존성0 미니 서버. createSession 이 라우트 핸들러+상태를 들고,
// startServer 가 그것을 HTTP 라우팅에 연결한다(Task 8). 핸들러는 브라우저 없이 단위 테스트 가능.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 편집 세션: 미리보기 맵 + 확정/취소 Promise + 핸들러. 워치독·HTTP는 후속 Task 에서 더한다.
export function createSession({ runEditCycle, saveFinal, idleMs = 600_000, heartbeatMs = 10_000 }) {
  const previews = new Map(); // previewId -> { bbox, prompt, quality, outPath }
  let seq = 0, alive = true, resolveExit;
  let lastPing = 0, started = 0, nowFn = () => 0;
  const exitPromise = new Promise((res) => { resolveExit = res; });
  function finish(result) { if (!alive) return; alive = false; resolveExit(result); }

  const session = {
    waitForExit: () => exitPromise,
    isAlive: () => alive,
    getPreview: (id) => previews.get(id),
    finish,
    async handleEdit({ bbox, prompt }) {
      try {
        const { outPath } = await runEditCycle({ bbox, prompt, quality: 'low' });
        const previewId = `p${++seq}`;
        previews.set(previewId, { bbox, prompt, quality: 'low', outPath });
        return { previewId };
      } catch (err) { return { error: err.message }; }
    },
    async handleConfirm({ previewId }) {
      const p = previews.get(previewId);
      if (!p) throw new Error(`알 수 없는 previewId: ${previewId}`);
      const savedPath = await saveFinal(p.bbox, p.prompt); // 고품질 재실행
      finish({ status: 'confirmed', path: savedPath });
      return { savedPath };
    },
    async handleCancel() { finish({ status: 'cancelled' }); return { ok: true }; },
    handlePing() { lastPing = nowFn(); },
    startWatchdog({ now, setTimer, clearTimer, tickMs = 1000 } = {}) {
      nowFn = now || (() => Date.now());
      lastPing = nowFn(); started = nowFn();
      const tick = () => {
        if (!alive) return;
        const t = nowFn();
        if (t - lastPing >= heartbeatMs) finish({ status: 'cancelled', reason: 'window-closed' });
        else if (t - started >= idleMs) finish({ status: 'cancelled', reason: 'idle-timeout' });
      };
      const id = (setTimer || ((fn, ms) => { const h = setInterval(fn, ms); h.unref?.(); return h; }))(tick, tickMs);
      return { stop: () => (clearTimer || clearInterval)(id) };
    },
  };
  return session;
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function sendJson(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
async function sendFile(res, file, type) {
  try { const buf = await readFile(file); res.writeHead(200, { 'content-type': type }); res.end(buf); }
  catch { res.writeHead(404); res.end('not found'); }
}

// 세션 핸들러를 node:http 에 연결하고 listen(0). { url, close, port } 반환.
export async function startServer({ session, imagePath, uiDir = path.join(__dirname, 'ui') }) {
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && u.pathname === '/') return sendFile(res, path.join(uiDir, 'index.html'), 'text/html; charset=utf-8');
      if (req.method === 'GET' && u.pathname === '/app.js') return sendFile(res, path.join(uiDir, 'app.js'), 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && u.pathname === '/image') return sendFile(res, imagePath, 'image/png');
      if (req.method === 'GET' && u.pathname.startsWith('/preview/')) {
        const id = u.pathname.slice('/preview/'.length);
        const p = session.getPreview(id);
        if (!p) { res.writeHead(404); return res.end('no preview'); }
        return sendFile(res, p.outPath, 'image/png');
      }
      if (req.method === 'POST' && u.pathname === '/edit') return sendJson(res, 200, await session.handleEdit(await readJson(req)));
      if (req.method === 'POST' && u.pathname === '/confirm') {
        try { return sendJson(res, 200, await session.handleConfirm(await readJson(req))); }
        catch (e) { return sendJson(res, 400, { error: e.message }); }
      }
      if (req.method === 'POST' && u.pathname === '/cancel') return sendJson(res, 200, await session.handleCancel());
      if (req.method === 'POST' && u.pathname === '/ping') { session.handlePing(); return sendJson(res, 200, { ok: true }); }
      res.writeHead(404); res.end('not found');
    } catch (err) { sendJson(res, 500, { error: err.message }); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, port, close: () => new Promise((r) => server.close(r)) };
}
