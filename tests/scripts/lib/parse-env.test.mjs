import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../../../scripts/lib/parse-env.mjs';

test('parses simple KEY=VALUE', () => {
  assert.deepEqual(parseEnv('FOO=bar'), { FOO: 'bar' });
});

test('ignores blank lines and comments', () => {
  const text = `# comment\n\nFOO=bar\n# trailing\n`;
  assert.deepEqual(parseEnv(text), { FOO: 'bar' });
});

test('handles double-quoted values with escapes', () => {
  assert.deepEqual(parseEnv('FOO="hello\\nworld"'), { FOO: 'hello\nworld' });
});

test('handles single-quoted values literally', () => {
  assert.deepEqual(parseEnv("FOO='hello\\nworld'"), { FOO: 'hello\nworld' });
});

test('accepts optional export prefix', () => {
  assert.deepEqual(parseEnv('export FOO=bar'), { FOO: 'bar' });
});

test('handles multiple lines and CRLF', () => {
  const text = 'FOO=1\r\nBAR=2\r\n';
  assert.deepEqual(parseEnv(text), { FOO: '1', BAR: '2' });
});

test('returns empty object for empty input', () => {
  assert.deepEqual(parseEnv(''), {});
});

test('skips malformed lines silently', () => {
  assert.deepEqual(parseEnv('FOO=bar\nnot_a_kv_line\nBAZ=qux'), { FOO: 'bar', BAZ: 'qux' });
});
