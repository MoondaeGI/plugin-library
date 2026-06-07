import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentMd, toCodexToml } from '../../../scripts/lib/transform-agent.mjs';

const sampleMd = `---
name: designer
description: 디자인 작업을 협업한다
tools: Read, Write, Skill
model: inherit
---

당신은 디자이너다.
한국어로 일한다.
`;

test('parseAgentMd extracts frontmatter and body', () => {
  const { frontmatter, body } = parseAgentMd(sampleMd);
  assert.equal(frontmatter.name, 'designer');
  assert.equal(frontmatter.description, '디자인 작업을 협업한다');
  assert.equal(frontmatter.tools, 'Read, Write, Skill');
  assert.equal(frontmatter.model, 'inherit');
  assert.equal(body, '당신은 디자이너다.\n한국어로 일한다.\n');
});

test('parseAgentMd throws without opening fence', () => {
  assert.throws(() => parseAgentMd('no frontmatter here'), /frontmatter fence/);
});

test('parseAgentMd throws without closing fence', () => {
  assert.throws(() => parseAgentMd('---\nname: x\n'), /closing/);
});

test('toCodexToml includes name, description, developer_instructions', () => {
  const toml = toCodexToml({ name: 'designer', description: '디자인 작업을 협업한다', body: '당신은 디자이너다.\n' });
  assert.match(toml, /^name = "designer"$/m);
  assert.match(toml, /^description = "디자인 작업을 협업한다"$/m);
  assert.match(toml, /developer_instructions = '''/);
  assert.match(toml, /당신은 디자이너다\./);
});

test('toCodexToml excludes Claude-only model and tools', () => {
  const toml = toCodexToml({ name: 'designer', description: 'd', body: 'b\n' });
  assert.doesNotMatch(toml, /^model =/m);
  assert.doesNotMatch(toml, /^tools =/m);
});

test('toCodexToml escapes quotes and backslashes in description', () => {
  const toml = toCodexToml({ name: 'a', description: 'say "hi" c:\\\\x', body: 'b\n' });
  assert.match(toml, /description = "say \\"hi\\" c:\\\\\\\\x"/);
});

test('toCodexToml throws when body contains a literal triple-quote', () => {
  assert.throws(() => toCodexToml({ name: 'a', description: 'd', body: "x ''' y\n" }), /triple/);
});

test('toCodexToml requires name and description', () => {
  assert.throws(() => toCodexToml({ description: 'd', body: 'b\n' }), /name/);
  assert.throws(() => toCodexToml({ name: 'a', body: 'b\n' }), /description/);
});
