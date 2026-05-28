#!/usr/bin/env node
// 공유 이미지 생성기 — OpenAI Images API를 직접 호출한다 (디자인 스킬 등이 공유).
//
// Codex 내장 `image_gen` 도구에 의존하지 않으므로 Claude·Codex 어디서든 동작하고,
// 출력 위치를 `--out`으로 직접 지정한다(생성물이 ~/.codex/에 갇히지 않음).
// 외부 의존성 없음 — Node >=18의 전역 fetch만 사용. OPENAI_API_KEY를 환경변수에서 읽는다.
// 범용: "프롬프트 in → 이미지 out". 스킬별 브리프/포맷은 알지 못한다 (호출하는 쪽이
// 프롬프트를 구성해 --prompt-file로 넘긴다).
//
// 사용법:
//   node image-gen.mjs --prompt "..."       --out <경로> [옵션]
//   node image-gen.mjs --prompt-file <파일>  --out <경로> [옵션]
//
// 옵션:
//   --size           auto | WIDTHxHEIGHT     (기본 auto; gpt-image-2는 변 16의 배수, 최대 3840, 비율 <=3:1)
//   --quality        low | medium | high | auto   (기본 medium)
//   --model          이미지 모델             (기본 gpt-image-2; 키에 접근권 없으면 gpt-image-1)
//   --n              변형 개수 1-10          (기본 1; >1이면 파일명에 -1,-2… 접미)
//   --output-format  png | jpeg | webp       (기본 png)
//   --force          기존 파일 덮어쓰기 허용
//   --dry-run        API 호출 없이 페이로드·출력 경로만 출력 (키 불필요)
//   --help

import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from '../../../scripts/lib/load-env.mjs';

const ENDPOINT = 'https://api.openai.com/v1/images/generations';
const EDITS_ENDPOINT = 'https://api.openai.com/v1/images/edits';
const TIMEOUT_MS = 300_000;

const HELP = `image-gen.mjs — OpenAI Images API 직접 호출 (Codex 비의존)

  node image-gen.mjs --prompt-file <파일> --out <경로> [--size WxH] [--quality high] [--model gpt-image-2] [--n 1] [--force] [--dry-run]

OPENAI_API_KEY 환경변수가 필요하다 (--dry-run 제외). --help로 이 도움말 출력.`;

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = {
    size: 'auto',
    quality: 'medium',
    model: 'gpt-image-2',
    n: 1,
    outputFormat: 'png',
    force: false,
    dryRun: false,
    images: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--prompt': opts.prompt = next(); break;
      case '--prompt-file': opts.promptFile = next(); break;
      case '--image': opts.images.push(next()); break;
      case '--input-fidelity': opts.inputFidelity = next(); break;
      case '--out': opts.out = next(); break;
      case '--size': opts.size = next(); break;
      case '--quality': opts.quality = next(); break;
      case '--model': opts.model = next(); break;
      case '--n': opts.n = parseInt(next(), 10); break;
      case '--output-format': opts.outputFormat = next(); break;
      case '--force': opts.force = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: die(`오류: 알 수 없는 인자 "${a}" (--help 참고).`);
    }
  }
  return opts;
}

function outPaths(out, n, ext) {
  if (n <= 1) return [out];
  const dir = path.dirname(out);
  const base = path.basename(out, path.extname(out));
  return Array.from({ length: n }, (_, i) => path.join(dir, `${base}-${i + 1}${ext}`));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }

  let prompt = opts.prompt;
  if (opts.promptFile) prompt = readFileSync(opts.promptFile, 'utf8');
  if (!prompt || !prompt.trim()) die('오류: --prompt 또는 --prompt-file 가 필요합니다.');
  if (!opts.out) die('오류: --out <경로> 가 필요합니다.');
  if (!Number.isInteger(opts.n) || opts.n < 1 || opts.n > 10) die('오류: --n 은 1-10 사이 정수여야 합니다.');
  for (const img of opts.images) {
    if (!existsSync(img)) die(`오류: --image 파일을 찾을 수 없습니다: ${img}`);
  }
  if (opts.inputFidelity && !['high', 'low'].includes(opts.inputFidelity)) {
    die('오류: --input-fidelity 는 high 또는 low 여야 합니다.');
  }

  const ext = '.' + (opts.outputFormat === 'jpeg' ? 'jpg' : opts.outputFormat);
  const targets = outPaths(opts.out, opts.n, ext);

  if (!opts.force) {
    const clash = targets.find((p) => existsSync(p));
    if (clash) die(`오류: 이미 존재합니다: ${clash}\n(덮어쓰려면 --force, 또는 버전 파일명 -v2 를 쓰세요.)`);
  }

  const useEdits = opts.images.length > 0;
  const endpoint = useEdits ? EDITS_ENDPOINT : ENDPOINT;

  const fields = {
    model: opts.model,
    prompt,
    n: opts.n,
    size: opts.size,
    quality: opts.quality,
    output_format: opts.outputFormat,
  };
  if (useEdits && opts.inputFidelity) fields.input_fidelity = opts.inputFidelity;

  if (opts.dryRun) {
    const preview = prompt.trim().slice(0, 80) + (prompt.trim().length > 80 ? '…' : '');
    console.log('[dry-run] POST ' + endpoint);
    if (useEdits) {
      console.log(`[dry-run] images (${opts.images.length}):`);
      opts.images.forEach((p) => console.log('  ' + path.resolve(p)));
    }
    console.log('[dry-run] payload: ' + JSON.stringify({ ...fields, prompt: preview }, null, 2));
    console.log('[dry-run] out:');
    targets.forEach((p) => console.log('  ' + path.resolve(p)));
    return;
  }

  const apiKey = loadEnv().OPENAI_API_KEY;
  if (!apiKey) {
    die(
      [
        '오류: OPENAI_API_KEY 가 설정돼 있지 않습니다.',
        '플러그인 루트의 `.env`에 OPENAI_API_KEY=sk-... 를 추가하세요 (저장 즉시 반영, 재시작 불필요).',
        'Codex에서는 `.env` 수정 후 `npm run codex:reinstall`로 번들을 갱신하세요.',
        '또는 직접 환경변수로: PowerShell `$env:OPENAI_API_KEY = "sk-..."`, bash `export OPENAI_API_KEY="sk-..."`.',
      ].join('\n'),
      2,
    );
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: ac.signal,
    });
  } catch (err) {
    die(`오류: API 요청 실패 — ${err.name === 'AbortError' ? `${TIMEOUT_MS}ms 타임아웃` : err.message}`, 1);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) die(`오류: API ${res.status} — ${text}`, 1);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    die(`오류: 응답 JSON 파싱 실패 — ${text.slice(0, 200)}`, 1);
  }

  const data = json.data || [];
  if (data.length === 0) die('오류: 응답에 이미지 데이터가 없습니다.', 1);

  const saved = [];
  for (let i = 0; i < targets.length && i < data.length; i++) {
    const b64 = data[i].b64_json;
    if (!b64) die(`오류: data[${i}] 에 b64_json 이 없습니다.`, 1);
    const abs = path.resolve(targets[i]);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, Buffer.from(b64, 'base64'));
    saved.push(abs);
  }
  saved.forEach((p) => console.log(p));
}

main().catch((err) => {
  console.error(`오류: ${err.message}`);
  process.exit(1);
});
