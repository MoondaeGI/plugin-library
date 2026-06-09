#!/usr/bin/env node
// CLI 진입점: 인자 검증 → 서버 기동 → 브라우저 오픈 → 확정/취소까지 대기 → 결과 경로 출력.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createSession, startServer } from './server.mjs';
import { runEditCycle, defaultRunImageGen } from './edit-cycle.mjs';
import { resolveBrowser } from '../../web-publisher-qa/scripts/screenshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RegionEditInputError extends Error {
  constructor(message) { super(message); this.name = 'RegionEditInputError'; }
}

export function parseArgs(argv) {
  const o = { image: undefined, prompt: '', out: undefined, model: 'gpt-image-2' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; const next = () => argv[++i];
    switch (a) {
      case '--image': o.image = next(); break;
      case '--prompt': o.prompt = next() ?? ''; break;
      case '--out': o.out = next(); break;
      case '--model': o.model = next(); break;
      case '--help': case '-h': o.help = true; break;
      default: throw new RegionEditInputError(`알 수 없는 인자: ${a}`);
    }
  }
  if (!o.help && !o.image) throw new RegionEditInputError('--image <png 경로> 가 필요합니다.');
  return o;
}

export function resolveOutPath(image, out) {
  if (out) return out;
  const dir = path.dirname(image); const ext = path.extname(image);
  return `${dir}/${path.basename(image, ext)}-edited.png`;
}

function openBrowser(url) {
  const browser = resolveBrowser();
  if (!browser) throw new RegionEditInputError('설치된 브라우저(Edge/Chrome/Brave)를 찾지 못했습니다.');
  const child = spawn(browser, [url], { detached: true, stdio: 'ignore' });
  child.unref();
  return child;
}

export async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('usage: node region-edit.mjs --image <png> [--prompt ...] [--out ...] [--model ...]'); return 0; }
  const image = path.resolve(opts.image);
  if (!existsSync(image)) throw new RegionEditInputError(`이미지를 찾을 수 없습니다: ${image}`);
  const outPath = resolveOutPath(image, opts.out);
  const workDir = mkdtempSync(path.join(tmpdir(), 'image-edit-region-'));

  const session = createSession({
    runEditCycle: ({ bbox, prompt, quality }) =>
      runEditCycle({ imagePath: image, bbox, prompt, quality, workDir, runImageGen: defaultRunImageGen }),
    saveFinal: async (bbox, prompt) => {
      const r = await runEditCycle({ imagePath: image, bbox, prompt, quality: 'high', workDir, runImageGen: defaultRunImageGen });
      const { copyFileSync } = await import('node:fs');
      copyFileSync(r.outPath, outPath);
      return outPath;
    },
  });

  const { url, close } = await startServer({ session, imagePath: image, uiDir: path.join(__dirname, 'ui') });
  const watch = session.startWatchdog({});
  const guiUrl = opts.prompt ? `${url}/?prompt=${encodeURIComponent(opts.prompt)}` : url;
  openBrowser(guiUrl);
  process.on('SIGINT', () => session.finish({ status: 'cancelled', reason: 'sigint' }));

  console.error(`브라우저에서 영역을 편집하세요: ${guiUrl}`);
  const result = await session.waitForExit();
  watch.stop();
  await close();
  rmSync(workDir, { recursive: true, force: true });

  if (result.status === 'confirmed') { console.log(result.path); return 0; }
  console.error(`취소됨(${result.reason || 'user'}).`);
  return 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).then((c) => process.exit(c)).catch((err) => {
    console.error(`오류: ${err.message}`);
    process.exit(err instanceof RegionEditInputError ? 2 : 1);
  });
}
