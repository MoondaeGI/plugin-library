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
