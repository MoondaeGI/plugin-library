import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runEditCycle } from '../../../../skills/image-edit-region/scripts/edit-cycle.mjs';
import { encodePNG, decodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w, h, c) {
  const px = Buffer.alloc(w*h*4);
  for (let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}
  return encodePNG(px, w, h, 6);
}

test('runEditCycle: 마스크를 만들고 image-gen 을 부른 뒤 결과를 재합성한다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255])); // 빨강

  let seen = null;
  // image-gen 모킹: 호출 인자를 기록하고, --out 위치에 파랑 이미지를 떨군다.
  const runImageGen = async (args) => {
    seen = args;
    const outIdx = args.indexOf('--out');
    writeFileSync(args[outIdx + 1], solid(4, 4, [0, 0, 255, 255]));
    return { status: 0, stdout: args[outIdx + 1], stderr: '' };
  };

  const res = await runEditCycle({
    imagePath, bbox: { x: 1, y: 1, w: 2, h: 2 }, prompt: '파랗게',
    quality: 'low', workDir: dir, runImageGen,
  });

  // image-gen 에 --image(원본)·--mask·--prompt·--quality low 가 넘어갔는지
  assert.ok(seen.includes('--image') && seen.includes(imagePath));
  assert.ok(seen.includes('--mask'));
  assert.ok(seen.includes('--quality') && seen[seen.indexOf('--quality')+1] === 'low');
  // 결과 파일 존재 + bbox 안 파랑/밖 빨강
  assert.ok(existsSync(res.outPath));
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(0,0), [255,0,0,255]);
  assert.deepEqual(at(1,1), [0,0,255,255]);
});

test('runEditCycle: image-gen 비정상 종료 시 에러를 던진다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const runImageGen = async () => ({ status: 1, stdout: '', stderr: 'API 500' });
  await assert.rejects(
    runEditCycle({ imagePath, bbox: { x:0,y:0,w:2,h:2 }, prompt:'x', quality:'low', workDir: dir, runImageGen }),
    /image-gen/,
  );
});
