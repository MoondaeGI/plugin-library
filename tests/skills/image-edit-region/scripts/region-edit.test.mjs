import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, resolveOutPath, resolveGuiBrowser } from '../../../../skills/image-edit-region/scripts/region-edit.mjs';

test('parseArgs: --image 필수, --prompt·--out 선택', () => {
  const o = parseArgs(['--image', 'a.png']);
  assert.equal(o.image, 'a.png');
  assert.equal(o.prompt, '');
  assert.equal(o.out, undefined);
});

test('parseArgs: --image 누락은 throw', () => {
  assert.throws(() => parseArgs(['--prompt', 'x']), /--image/);
});

test('resolveOutPath: 미지정 시 <이름>-edited.png', () => {
  assert.equal(resolveOutPath('/p/foo.png', undefined), '/p/foo-edited.png');
  assert.equal(resolveOutPath('/p/foo.png', '/q/bar.png'), '/q/bar.png');
});

test('parseArgs: --browser 경로를 받는다', () => {
  const o = parseArgs(['--image', 'a.png', '--browser', '/path/to/chrome']);
  assert.equal(o.browser, '/path/to/chrome');
});

test('resolveGuiBrowser: 명시 경로는 그대로 반환(파일시스템 미조회)', () => {
  assert.equal(resolveGuiBrowser('/explicit/chrome'), '/explicit/chrome');
});
