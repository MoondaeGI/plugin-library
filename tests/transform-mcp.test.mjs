import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toClaudeFormat, toCodexFormat, extractPlaceholders } from '../scripts/lib/transform-mcp.mjs';

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
