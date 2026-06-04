#!/usr/bin/env node
// web-publisher-qa: OS 설치 브라우저로 HTML을 breakpoint별 스크린샷한다.
// npm 의존성 0 — Edge/Chrome/Chromium/Brave를 --headless=new --screenshot으로 호출.
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DEFAULT_WIDTHS = [375, 768, 1280];
const DEFAULT_HEIGHT = 1100;

// 플랫폼별 Chromium 계열 실행 파일 후보(우선순위 순).
export function defaultBrowserCandidates(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    const pf = env['ProgramFiles'] || 'C:\\Program Files';
    const pfx86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = env['LOCALAPPDATA'] || '';
    const list = [
      `${pfx86}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pfx86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pf}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${pfx86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ];
    if (local) {
      list.push(`${local}\\Google\\Chrome\\Application\\chrome.exe`);
      list.push(`${local}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`);
    }
    return list;
  }
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
  ];
}

export function resolveBrowser({ candidates, exists = existsSync } = {}) {
  const list = candidates ?? defaultBrowserCandidates();
  for (const p of list) {
    if (exists(p)) return p;
  }
  return null;
}

export function parseWidths(raw, defaults = DEFAULT_WIDTHS) {
  if (!raw || raw.length === 0) return [...defaults];
  const widths = raw
    .flatMap((s) => String(s).split(','))
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (widths.length === 0) throw new Error(`invalid --width values: ${raw.join(' ')}`);
  return widths;
}

export function buildScreenshotArgs({ htmlPath, outPath, width, height = DEFAULT_HEIGHT }) {
  const fileUrl = pathToFileURL(path.resolve(htmlPath)).href;
  return [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars=false',
    `--screenshot=${outPath}`,
    `--window-size=${width},${height}`,
    fileUrl,
  ];
}

export function planCaptures({ htmlPath, outDir, widths, height = DEFAULT_HEIGHT }) {
  const base = path.basename(htmlPath).replace(/\.[^.]+$/, '') || 'page';
  return widths.map((width) => {
    const outPath = path.join(outDir, `${base}-${width}.png`);
    return { width, outPath, args: buildScreenshotArgs({ htmlPath, outPath, width, height }) };
  });
}

const USAGE =
  'usage: node screenshot.mjs <html-file> [--widths 375,768,1280] [--out <dir>] [--browser <path>] [--print-plan]';

export function parseArgv(argv) {
  const opts = { htmlPath: null, widths: [], outDir: null, browser: null, printPlan: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--print-plan') opts.printPlan = true;
    else if (a === '--width' || a === '--widths') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} 값이 필요합니다`);
      opts.widths.push(v);
    } else if (a === '--out') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error('--out 값이 필요합니다');
      opts.outDir = v;
    } else if (a === '--browser') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error('--browser 값이 필요합니다');
      opts.browser = v;
    } else if (a.startsWith('--')) {
      throw new Error(`알 수 없는 플래그: ${a}`);
    } else if (opts.htmlPath === null) {
      opts.htmlPath = a;
    } else {
      throw new Error(`예상치 못한 인자: ${a}`);
    }
  }
  return opts;
}

export function main(argv) {
  let opts;
  try {
    opts = parseArgv(argv);
  } catch (e) {
    process.stderr.write(e.message + '\n' + USAGE + '\n');
    return 2;
  }
  if (!opts.htmlPath) {
    process.stderr.write('html 파일 경로가 필요합니다\n' + USAGE + '\n');
    return 2;
  }
  const htmlPath = path.resolve(opts.htmlPath);
  if (!existsSync(htmlPath)) {
    process.stderr.write(`찾을 수 없는 파일: ${htmlPath}\n`);
    return 2;
  }
  let widths;
  try {
    widths = parseWidths(opts.widths);
  } catch (e) {
    process.stderr.write(e.message + '\n');
    return 2;
  }
  const outDir = opts.outDir
    ? path.resolve(opts.outDir)
    : opts.printPlan
      ? path.join(tmpdir(), 'wp-qa-(temp)')
      : mkdtempSync(path.join(tmpdir(), 'wp-qa-'));
  const browser = opts.browser ?? resolveBrowser();
  const captures = planCaptures({ htmlPath, outDir, widths });

  if (opts.printPlan) {
    process.stdout.write(
      JSON.stringify(
        { htmlPath, outDir, browser, widths, captures: captures.map((c) => ({ width: c.width, outPath: c.outPath })) },
        null,
        2,
      ) + '\n',
    );
    return 0;
  }
  if (!browser) {
    process.stderr.write('스크린샷용 브라우저를 찾지 못했습니다 — 시각 검사를 건너뜁니다.\n');
    return 3;
  }
  mkdirSync(outDir, { recursive: true });
  const produced = [];
  for (const c of captures) {
    const res = spawnSync(browser, c.args, { encoding: 'utf8' });
    if (res.status === 0 && existsSync(c.outPath)) produced.push(c.outPath);
  }
  process.stdout.write(JSON.stringify({ browser, outDir, produced }, null, 2) + '\n');
  return produced.length === captures.length ? 0 : 4;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exit(main(process.argv.slice(2)));
}
