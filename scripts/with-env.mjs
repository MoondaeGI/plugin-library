#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEnv } from './lib/parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PLUGIN_ROOT, '.env');

const fileEnv = existsSync(ENV_PATH)
  ? parseEnv(readFileSync(ENV_PATH, 'utf8'))
  : {};

const env = { ...fileEnv, ...process.env };

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('with-env: missing command');
  process.exit(2);
}

const child = spawn(cmd, args, {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const forward = (sig) => () => child.kill(sig);
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(signal === 'SIGTERM' ? 143 : 130);
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(`with-env: failed to spawn: ${err.message}`);
  process.exit(127);
});
