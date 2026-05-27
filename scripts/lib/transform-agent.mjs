// Claude 에이전트 markdown(YAML-ish frontmatter + 본문)을 파싱하고, 동일 에이전트의
// Codex 커스텀 에이전트 TOML을 생성한다.
//
// `model`/`tools`는 Claude 전용 frontmatter라 Codex TOML로 옮기지 않는다 —
// `opus`/`sonnet`은 Anthropic 모델 슬러그이고 Codex는 OpenAI 모델로 동작하므로
// 무의미하다. Codex는 `model` 생략 시 세션 모델을 상속한다.

const FENCE = '---';

// 단순 `key: value` frontmatter(단일 라인 값) + 본문을 분리한다.
export function parseAgentMd(mdText) {
  const lines = mdText.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== FENCE) {
    throw new Error('agent md: must start with a --- frontmatter fence');
  }
  const frontmatter = {};
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FENCE) { closeIdx = i; break; }
    if (lines[i].trim() === '') continue;
    const m = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) throw new Error(`agent md: unparseable frontmatter line: "${lines[i]}"`);
    frontmatter[m[1]] = m[2].trim();
  }
  if (closeIdx === -1) throw new Error('agent md: missing closing --- frontmatter fence');
  const body = lines.slice(closeIdx + 1).join('\n').trim() + '\n';
  return { frontmatter, body };
}

function tomlBasicString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

export function toCodexToml({ name, description, body } = {}) {
  if (!name) throw new Error('agent md: frontmatter requires `name`');
  if (!description) throw new Error('agent md: frontmatter requires `description`');
  if ((body ?? '').includes("'''")) {
    throw new Error("agent md: body contains a triple-quote (''') which breaks the TOML literal string");
  }
  const instr = body.endsWith('\n') ? body : body + '\n';
  return [
    `# Auto-generated from agents/${name}.md by scripts/sync-agents.mjs — do not edit manually.`,
    '# `model`/`tools`는 Claude 전용이라 여기엔 포함하지 않는다(Codex는 세션 모델 상속).',
    `name = ${tomlBasicString(name)}`,
    `description = ${tomlBasicString(description)}`,
    "developer_instructions = '''",
    instr.replace(/\n$/, ''),
    "'''",
    '',
  ].join('\n');
}
