import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toClaudeFormat, toCodexFormat, extractPlaceholders, renderEnvExample } from '../scripts/lib/transform-mcp.mjs';

const sample = {
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
  },
};

test('toCodexFormat returns the source unchanged', () => {
  assert.deepEqual(toCodexFormat(sample), sample);
});

test('toClaudeFormat wraps in mcpServers', () => {
  assert.deepEqual(toClaudeFormat(sample), { mcpServers: sample });
});

test('toClaudeFormat handles empty source', () => {
  assert.deepEqual(toClaudeFormat({}), { mcpServers: {} });
});

test('toCodexFormat handles empty source', () => {
  assert.deepEqual(toCodexFormat({}), {});
});

test('extractPlaceholders finds ${VAR} in env values', () => {
  assert.deepEqual(extractPlaceholders(sample), ['GITHUB_TOKEN']);
});

test('extractPlaceholders dedupes and sorts', () => {
  const src = {
    a: { command: 'x', env: { TOKEN: '${TOKEN}', URL: '${URL}' } },
    b: { command: 'y', env: { TOKEN: '${TOKEN}' } },
  };
  assert.deepEqual(extractPlaceholders(src), ['TOKEN', 'URL']);
});

test('extractPlaceholders also scans args for placeholders', () => {
  const src = {
    a: { command: 'x', args: ['--endpoint', '${API_ENDPOINT}'], env: {} },
  };
  assert.deepEqual(extractPlaceholders(src), ['API_ENDPOINT']);
});

test('extractPlaceholders returns empty array when none', () => {
  assert.deepEqual(extractPlaceholders({}), []);
});

test('renderEnvExample lists MCP placeholders under their section', () => {
  const out = renderEnvExample(['GITHUB_TOKEN']);
  assert.match(out, /# MCP 서버/);
  assert.match(out, /^GITHUB_TOKEN=$/m);
});

test('renderEnvExample emits extras with their comment', () => {
  const out = renderEnvExample([], [{ key: 'OPENAI_API_KEY', comment: 'image-gen' }]);
  assert.match(out, /# 스킬\/스크립트 env/);
  assert.match(out, /# image-gen/);
  assert.match(out, /^OPENAI_API_KEY=$/m);
  // no MCP placeholders → no MCP section
  assert.doesNotMatch(out, /# MCP 서버/);
});

test('renderEnvExample skips an extra already covered by an MCP placeholder', () => {
  const out = renderEnvExample(['OPENAI_API_KEY'], [{ key: 'OPENAI_API_KEY', comment: 'x' }]);
  assert.equal((out.match(/OPENAI_API_KEY=/g) || []).length, 1);
});

test('renderEnvExample always emits the header', () => {
  assert.match(renderEnvExample([], []), /^# Auto-generated from mcp\.servers\.json/);
});
