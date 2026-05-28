const PLACEHOLDER_RE = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

export function toCodexFormat(source) {
  return source;
}

export function toClaudeFormat(source) {
  return { mcpServers: source };
}

export function extractPlaceholders(source) {
  const found = new Set();
  const scan = (v) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(PLACEHOLDER_RE)) found.add(m[1]);
    } else if (Array.isArray(v)) {
      v.forEach(scan);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(scan);
    }
  };
  scan(source);
  return [...found].sort();
}

// MCP placeholder(`${VAR}`)와 스킬/스크립트용 비-MCP env 변수를 합쳐 .env.example 본문을 만든다.
// extras: [{ key, comment? }] — process.env로 직접 읽혀 ${VAR} 참조가 없는 값들.
export function renderEnvExample(placeholders, extras = []) {
  const lines = [
    '# Auto-generated from mcp.servers.json + 스킬 env 선언 — 직접 수정하지 말 것',
    '# .env로 복사해 값을 채우면 스크립트가 바로 읽습니다 (재시작·apply 불필요).',
    '# Codex는 .env 수정 후 `npm run codex:reinstall`로 번들을 갱신하세요.',
  ];
  if (placeholders.length > 0) {
    lines.push('', '# MCP 서버 (mcp.servers.json의 ${VAR})');
    for (const k of placeholders) lines.push(`${k}=`);
  }
  const extra = extras.filter((e) => !placeholders.includes(e.key));
  if (extra.length > 0) {
    lines.push('', '# 스킬/스크립트 env (process.env로 직접 읽음)');
    for (const e of extra) {
      if (e.comment) lines.push(`# ${e.comment}`);
      lines.push(`${e.key}=`);
    }
  }
  return lines.join('\n') + '\n';
}
