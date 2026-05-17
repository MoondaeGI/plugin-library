# Plugin development

This repo is a personal monorepo plugin for both Claude Code and Codex CLI.
The same directory is recognized as a plugin by both tools.

## Workflow

- **Add an MCP server**: edit `mcp.servers.json`, then run `npm run sync`,
  then commit the source and the generated files.
- **Never commit secrets**: `.env` is gitignored. Real values stay there.
  All committed MCP entries reference variables via `${VAR_NAME}` placeholders.
  `scripts/check-secrets.mjs` blocks the sync if a real-looking secret is
  detected inside `mcp.servers.json`.
- **Do not hand-edit generated files**: `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, `.env.example`, and `.claude-plugin/mcp.sync-state.json`
  are produced by `scripts/sync-mcp.mjs`. Edit `mcp.servers.json` and re-run sync.

## Skills

- Skills live in `skills/<name>/SKILL.md` and are shared between Claude and Codex.
- Stick to the common frontmatter (`name`, `description`). Tool-specific
  extensions go in only if the other tool ignores unknown keys cleanly.
- Skill-local scripts go in `skills/<name>/scripts/`. Promote to top-level
  `scripts/` only when something else (a hook, another skill) also uses them.

## Testing locally

- Claude Code: `claude --plugin-dir .` from inside this directory.
- Codex CLI: register this repo as a marketplace via `.agents/plugins/marketplace.json`,
  then `/plugins` → install. Falls back to manual MCP entries in
  `~/.codex/config.toml` if Codex plugin install gives trouble.
- Run script tests anytime: `node --test scripts/`.

## Update flow

- Same machine, in-session: `/reload-plugins` after editing.
- Other machine: `git pull`, then `/reload-plugins` or `/plugin update personal`
  (depending on install method).
- "Auto-update on push" is not guaranteed — explicit `/plugin update`
  is the reliable trigger.
