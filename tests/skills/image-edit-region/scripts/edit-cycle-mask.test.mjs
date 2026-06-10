import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runEditCycle } from '../../../../skills/image-edit-region/scripts/edit-cycle.mjs';
import { buildMask } from '../../../../skills/image-edit-region/scripts/composite.mjs';
import { encodePNG, decodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w, h, c) {
  const px = Buffer.alloc(w*h*4);
  for (let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}
  return encodePNG(px, w, h, 6);
}

test('runEditCycle(maskBuf): --mask 로 마스크를 보내고 compositeMask 로 합성', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255])); // 빨강
  const maskBuf = buildMask(4, 4, { x: 1, y: 1, w: 2, h: 2 }); // (1,1)~(2,2) 편집

  let seen = null;
  const runImageGen = async (args) => {
    seen = args;
    writeFileSync(args[args.indexOf('--out') + 1], solid(4, 4, [0, 0, 255, 255])); // 파랑
    return { status: 0, stdout: '', stderr: '' };
  };

  // featherRadius 0 으로 하드 경계 유지 — compositeMask 정합을 정확값으로 검증
  const res = await runEditCycle({ imagePath, maskBuf, prompt: '파랗게', quality: 'low', workDir: dir, runImageGen, featherRadius: 0 });

  assert.ok(seen.includes('--mask'));
  assert.ok(seen.includes('--image') && seen.includes(imagePath));
  assert.ok(seen.includes('--size'));
  assert.equal(seen[seen.indexOf('--quality') + 1], 'low');
  assert.ok(existsSync(res.outPath));
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(0, 0), [255, 0, 0, 255]); // 보존
  assert.deepEqual(at(1, 1), [0, 0, 255, 255]); // 편집
});

test('runEditCycle(maskBuf): featherRadius 옵션이 경계를 블렌드한다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(32, 32, [255, 0, 0, 255])); // 빨강
  const maskBuf = buildMask(32, 32, { x: 8, y: 8, w: 16, h: 16 }); // 가운데 16x16 편집
  const runImageGen = async (args) => {
    writeFileSync(args[args.indexOf('--out') + 1], solid(32, 32, [0, 0, 255, 255])); // 파랑
    return { status: 0, stdout: '', stderr: '' };
  };
  const res = await runEditCycle({ imagePath, maskBuf, prompt: 'x', quality: 'low', workDir: dir, runImageGen, featherRadius: 4 });
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(0, 0), [255, 0, 0, 255]);   // 경계서 먼 보존 = 원본 빨강
  assert.deepEqual(at(15, 15), [0, 0, 255, 255]); // 편집 한가운데 = 파랑
  const edge = at(7, 16);                          // 경계 바로 바깥 = 블렌드
  assert.ok(edge[0] > 0 && edge[0] < 255 && edge[2] > 0 && edge[2] < 255);
});

test('runEditCycle(maskBuf): 기본은 페더 없이 하드 경계', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(32, 32, [255, 0, 0, 255]));
  const maskBuf = buildMask(32, 32, { x: 8, y: 8, w: 16, h: 16 });
  const runImageGen = async (args) => {
    writeFileSync(args[args.indexOf('--out') + 1], solid(32, 32, [0, 0, 255, 255]));
    return { status: 0, stdout: '', stderr: '' };
  };
  // featherRadius 미지정 → 기본 0(하드). 브러시가 소프트 마스크를 만들므로 서버 기본은 페더 없음.
  const res = await runEditCycle({ imagePath, maskBuf, prompt: 'x', quality: 'low', workDir: dir, runImageGen });
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(7, 16), [255, 0, 0, 255]); // 경계 바깥 = 순수 빨강(블렌드 없음)
  assert.deepEqual(at(8, 16), [0, 0, 255, 255]); // 경계 안 = 순수 파랑
});

test('runEditCycle(maskBuf): 편집 영역이 없는 마스크는 거부', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const emptyMask = solid(4, 4, [0, 0, 0, 255]); // 전부 불투명 = 편집 영역 없음
  await assert.rejects(
    runEditCycle({ imagePath, maskBuf: emptyMask, prompt: 'x', quality: 'low', workDir: dir, runImageGen: async () => ({ status: 0 }) }),
    /편집/,
  );
});

test('runEditCycle(maskBuf): 마스크 크기가 이미지와 다르면 거부', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const badMask = buildMask(3, 3, { x: 1, y: 1, w: 1, h: 1 });
  await assert.rejects(
    runEditCycle({ imagePath, maskBuf: badMask, prompt: 'x', quality: 'low', workDir: dir, runImageGen: async () => ({ status: 0 }) }),
    /마스크/,
  );
});
