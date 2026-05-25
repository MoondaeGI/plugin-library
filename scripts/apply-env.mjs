#!/usr/bin/env node
// .env(플러그인 루트, gitignore됨)에 적은 값을 OS 사용자 환경변수로 "주입"한다.
//
// 목적: .env를 비밀의 단일 소스로 두고, 그 값을 OS 레벨에 등록해 모든 프로세스가
// `process.env`로 읽게 한다 — MCP 서버(`${VAR}`는 런타임이 OS env에서 치환)와 일반
// 스크립트(예: 디자인 스킬의 image-gen.mjs)를 한 메커니즘으로 커버한다.
//
// Windows: `setx`로 사용자 레지스트리(HKCU\Environment)에 영구 등록 → 새 세션부터 적용.
// 그 외 OS: 자식 프로세스가 부모/시스템 env를 영구 변경할 수 없으므로 `export` 줄을
//          출력 → 사용자가 셸 프로파일에 추가.
//
// 사용법:
//   node scripts/apply-env.mjs                 # .env의 모든 키를 OS에 등록
//   node scripts/apply-env.mjs OPENAI_API_KEY  # 지정한 키만
//   node scripts/apply-env.mjs --dry-run       # 무엇을 등록할지(값 마스킹) 미리보기, 등록 안 함
//
// 주의: setx는 값 1024자 제한이 있고, `%`가 포함된 값은 별도 이스케이프가 필요할 수 있다.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEnv } from './lib/parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PLUGIN_ROOT, '.env');

// 등록 대상 키/값 쌍을 고른다. requested가 비면 .env의 모든 키.
export function selectKeys(fileEnv, requested) {
  const missing = requested.filter((k) => !(k in fileEnv));
  const keys = requested.length > 0 ? requested : Object.keys(fileEnv);
  const pairs = keys.filter((k) => k in fileEnv).map((k) => [k, fileEnv[k]]);
  return { pairs, missing };
}

// 비밀이 콘솔/로그에 노출되지 않게 값을 마스킹한다.
export function maskValue(v) {
  if (v == null || v === '') return '(empty)';
  if (v.length <= 4) return '*'.repeat(v.length);
  return v.slice(0, 3) + `…(${v.length} chars)`;
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const requested = argv.filter((a) => !a.startsWith('--'));

  if (!existsSync(ENV_PATH)) {
    console.error(`apply-env: ${ENV_PATH} 가 없습니다. 먼저 .env에 KEY=VALUE 를 작성하세요.`);
    process.exit(2);
  }

  const fileEnv = parseEnv(readFileSync(ENV_PATH, 'utf8'));
  const { pairs, missing } = selectKeys(fileEnv, requested);

  if (missing.length > 0) {
    console.error(`apply-env: .env에 없는 키: ${missing.join(', ')}`);
    process.exit(2);
  }
  if (pairs.length === 0) {
    console.error('apply-env: .env에 등록할 키가 없습니다.');
    process.exit(2);
  }

  const isWin = process.platform === 'win32';

  if (dryRun) {
    console.log(`[dry-run] ${isWin ? 'setx로 OS 사용자 환경변수에 등록' : 'export 안내 출력'} 대상:`);
    pairs.forEach(([k, v]) => console.log(`  ${k} = ${maskValue(v)}`));
    if (isWin) console.log('(실제 실행 시 새 세션부터 적용 — 터미널/Codex 재시작 필요.)');
    return;
  }

  if (!isWin) {
    console.log('# 이 OS는 자식 프로세스가 영구 env를 등록할 수 없습니다. 아래를 셸 프로파일에 추가하세요:');
    pairs.forEach(([k, v]) => console.log(`export ${k}=${JSON.stringify(v)}`));
    return;
  }

  const setxExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'setx.exe');
  let ok = 0;
  for (const [k, v] of pairs) {
    const res = spawnSync(setxExe, [k, v], { encoding: 'utf8' });
    if (res.status === 0) {
      console.log(`✓ ${k} = ${maskValue(v)}`);
      ok++;
    } else {
      const msg = (res.stderr || res.error?.message || `exit ${res.status}`).trim();
      console.error(`✗ ${k} 실패: ${msg}`);
    }
  }
  console.log(`\napply-env: ${ok}/${pairs.length}개 등록. 새 터미널/Codex 세션부터 적용됩니다.`);
  if (ok < pairs.length) process.exit(1);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) main();
