import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startServer, createSession } from '../../../../skills/image-edit-region/scripts/server.mjs';
import { encodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w,h,c){const px=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}return encodePNG(px,w,h,6);}

test('startServer: /image 는 원본 PNG, /edit 는 previewId, /confirm 은 종료', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-http-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4,4,[255,0,0,255]));
  const previewPng = path.join(dir, 'preview.png');
  writeFileSync(previewPng, solid(4,4,[0,0,255,255]));

  const session = createSession({
    runEditCycle: async () => ({ outPath: previewPng }),
    saveFinal: async () => path.join(dir, 'out.png'),
  });
  const { url, close } = await startServer({ session, imagePath, uiDir: path.resolve('skills/image-edit-region/scripts/ui') });

  const img = await fetch(`${url}/image`);
  assert.equal(img.headers.get('content-type'), 'image/png');

  const edit = await (await fetch(`${url}/edit`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ bbox:{x:0,y:0,w:2,h:2}, prompt:'x' }) })).json();
  assert.ok(edit.previewId);

  const done = session.waitForExit();
  const conf = await (await fetch(`${url}/confirm`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ previewId: edit.previewId }) })).json();
  assert.ok(conf.savedPath);
  assert.equal((await done).status, 'confirmed');
  await close();
});
