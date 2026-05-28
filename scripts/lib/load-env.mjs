#!/usr/bin/env node
// .env(레포 루트 또는 Codex 번들 루트)를 읽어 process.env와 병합해 반환한다.
// 비밀의 단일 소스는 .env — 스크립트가 직접 읽으므로 편집 즉시 반영된다(Claude in-place).
// Codex는 번들 스냅샷이라 sync가 .env를 번들 루트로 복사하고 같은 상대경로로 읽힌다.
// OS 환경변수가 있으면 그것이 우선한다(임시 오버라이드용).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEnv } from './parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENV_PATH = path.resolve(__dirname, '..', '..', '.env');

export function loadEnv({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  return { ...fileEnv, ...env };
}
