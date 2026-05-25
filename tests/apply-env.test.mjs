import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectKeys, maskValue } from '../scripts/apply-env.mjs';

test('selectKeys: requested 비면 .env의 모든 키', () => {
  const { pairs, missing } = selectKeys({ A: '1', B: '2' }, []);
  assert.deepEqual([...pairs].sort(), [['A', '1'], ['B', '2']]);
  assert.deepEqual(missing, []);
});

test('selectKeys: 지정 키만 고른다', () => {
  const { pairs, missing } = selectKeys({ A: '1', B: '2' }, ['B']);
  assert.deepEqual(pairs, [['B', '2']]);
  assert.deepEqual(missing, []);
});

test('selectKeys: .env에 없는 키를 missing으로 보고', () => {
  const { pairs, missing } = selectKeys({ A: '1' }, ['A', 'X']);
  assert.deepEqual(pairs, [['A', '1']]);
  assert.deepEqual(missing, ['X']);
});

test('maskValue: 비밀을 가린다', () => {
  assert.equal(maskValue('sk-abcdef123456'), 'sk-…(15 chars)');
  assert.equal(maskValue('ab'), '**');
  assert.equal(maskValue(''), '(empty)');
});
