#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { parseEnv } from '../../../scripts/lib/parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_ENV_PATH = path.join(PLUGIN_ROOT, '.env');
const VAR = 'LIBRARIAN_VAULT_PATH';
const REQUIRED = ['AGENTS.md', 'index.md'];

export function resolveVaultPath({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const merged = { ...fileEnv, ...env }; // process env wins over .env file
  const raw = (merged[VAR] ?? '').trim();
  if (!raw) {
    throw new Error(
      `${VAR} is not set. Add it to ${envPath} ` +
        `(e.g. ${VAR}=C:\\Users\\you\\work\\docs\\kb) or export it as an environment variable.`,
    );
  }
  const vaultPath = path.resolve(raw);
  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    throw new Error(`${VAR} points to "${vaultPath}", which is not an existing directory.`);
  }
  const missing = REQUIRED.filter((f) => !existsSync(path.join(vaultPath, f)));
  if (missing.length > 0) {
    throw new Error(
      `"${vaultPath}" is not a kb vault (missing ${missing.join(', ')}). Check ${VAR}.`,
    );
  }
  return vaultPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    process.stdout.write(resolveVaultPath() + '\n');
  } catch (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }
}
