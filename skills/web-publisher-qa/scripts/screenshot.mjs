#!/usr/bin/env node
// web-publisher-qa: OS 설치 브라우저로 HTML을 breakpoint별 스크린샷한다.
// npm 의존성 0 — Edge/Chrome/Chromium/Brave를 --headless=new --screenshot으로 호출.
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
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
