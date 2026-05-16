const PLACEHOLDER_ONLY = /^(?:\$\{[A-Z_][A-Z0-9_]*\})+$/;
const PLACEHOLDER_ANYWHERE = /\$\{[A-Z_][A-Z0-9_]*\}/;

const ERROR_PATTERNS = [
  { re: /^ghp_[A-Za-z0-9]{20,}$/, reason: 'looks like a GitHub personal access token' },
  { re: /^github_pat_[A-Za-z0-9_]{20,}$/, reason: 'looks like a GitHub fine-grained PAT' },
  { re: /^sk-ant-[A-Za-z0-9-]{10,}$/, reason: 'looks like an Anthropic API key' },
  { re: /^sk-(?:proj-)?[A-Za-z0-9-]{15,}$/, reason: 'looks like an OpenAI API key' },
  { re: /^xox[bp]-[A-Za-z0-9-]{15,}$/, reason: 'looks like a Slack token' },
  { re: /^glpat-[A-Za-z0-9_-]{15,}$/, reason: 'looks like a GitLab personal access token' },
  { re: /^AIza[A-Za-z0-9_-]{30,}$/, reason: 'looks like a Google API key' },
];

const WARN_OPAQUE_MIN_LEN = 40;
const WARN_OPAQUE_RE = /^[A-Za-z0-9_\-+/=]+$/;

export function classifyValue(value) {
  if (typeof value !== 'string') return { level: 'ok' };
  if (value === '') return { level: 'ok' };

  if (PLACEHOLDER_ONLY.test(value)) return { level: 'ok' };
  if (PLACEHOLDER_ANYWHERE.test(value)) return { level: 'ok' };

  for (const { re, reason } of ERROR_PATTERNS) {
    if (re.test(value)) return { level: 'error', reason };
  }

  if (value.length >= WARN_OPAQUE_MIN_LEN && WARN_OPAQUE_RE.test(value)) {
    return { level: 'warn', reason: 'long opaque-looking string — verify this is not a secret' };
  }

  return { level: 'ok' };
}
