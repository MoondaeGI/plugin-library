import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyValue } from './secret-patterns.mjs';

test('placeholder is OK', () => {
  assert.equal(classifyValue('${GITHUB_TOKEN}').level, 'ok');
});

test('placeholder with multiple vars is OK', () => {
  assert.equal(classifyValue('${A}/${B}').level, 'ok');
});

test('GitHub PAT prefix is ERROR', () => {
  const r = classifyValue('ghp_abc123def456ghi789jkl012mno345pqr678');
  assert.equal(r.level, 'error');
  assert.match(r.reason, /github/i);
});

test('OpenAI key prefix is ERROR', () => {
  const r = classifyValue('sk-proj-abc123def456ghi789');
  assert.equal(r.level, 'error');
});

test('Slack bot token is ERROR', () => {
  const r = classifyValue('xoxb-1234567890-abcdefghij');
  assert.equal(r.level, 'error');
});

test('GitLab PAT prefix is ERROR', () => {
  const r = classifyValue('glpat-abc123def456ghi789');
  assert.equal(r.level, 'error');
});

test('Anthropic key prefix is ERROR', () => {
  const r = classifyValue('sk-ant-api03-abcdef');
  assert.equal(r.level, 'error');
});

test('short plain string is OK', () => {
  assert.equal(classifyValue('hello').level, 'ok');
});

test('empty string is OK', () => {
  assert.equal(classifyValue('').level, 'ok');
});

test('long opaque-looking string is WARN', () => {
  const r = classifyValue('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6');
  assert.equal(r.level, 'warn');
});
