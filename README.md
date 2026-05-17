# personal plugin

Personal Claude Code + Codex CLI plugin. Single repo, two manifests, shared
MCP source and skills.

## Quick start

```powershell
git clone <this-repo> plugin
cd plugin
npm install           # runs sync automatically via the prepare script
cp .env.example .env
# open .env and fill in real values
```

## Install

### Claude Code

Local development:
```powershell
claude --plugin-dir .
```

Marketplace install (one-time):
```
/plugin marketplace add <path-or-git-url-to-this-repo>
/plugin install personal
```

### Codex CLI

Inside Codex: `/plugins` → install from the bundled marketplace in
`.agents/plugins/marketplace.json`.

## Layout

- `mcp.servers.json` — single source for MCP server definitions (edit this)
- `scripts/sync-mcp.mjs` — regenerates `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, and `.env.example` from the source
- `scripts/with-env.mjs` — wraps every MCP command and injects `.env`
- `skills/` — skills shared between Claude and Codex
- `hooks/hooks.json` — session hooks (currently: stale-sync check)

For development guidance, see [AGENTS.md](./AGENTS.md).

## Adding an MCP server

Edit `mcp.servers.json`:

```json
{
  "example": {
    "command": "node",
    "args": ["./scripts/with-env.mjs", "npx", "-y", "@example/mcp-server"],
    "env": { "EXAMPLE_API_KEY": "${EXAMPLE_API_KEY}" }
  }
}
```

Then:
```powershell
npm run sync
```

Generated files are updated. Add the new variable to `.env`, then `/reload-plugins`.
