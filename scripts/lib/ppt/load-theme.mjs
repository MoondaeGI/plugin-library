// 테마 이름 → theme.json 해석. 내장(skills/ppt-theme/themes/) 우선, 다음 PPT_THEME_DIR.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv, DEFAULT_ENV_PATH } from '../load-env.mjs';
import { LAYOUTS } from './validate-spec.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');
const BUILTIN_DIR = path.join(PLUGIN_ROOT, 'skills', 'ppt-theme', 'themes');

// 레이아웃 8종 계약은 validate-spec.mjs의 LAYOUTS가 단일 권위.
// 여기서 파생시켜 두 모듈을 손으로 동기화할 일을 없앤다 (코드 리뷰 Important).
export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export class ThemeNotFoundError extends Error {
  constructor(name, available) {
    super(`테마 "${name}"를 찾을 수 없습니다. 사용 가능: ${available.join(', ') || '(없음)'}. ` +
      `커스텀 테마는 .env의 PPT_THEME_DIR 아래 <이름>/theme.json으로 둡니다.`);
    this.name = 'ThemeNotFoundError';
  }
}

export class ThemeInvalidError extends Error {
  constructor(name, missing) {
    super(`테마 "${name}"에 레이아웃 ${missing.join(', ')}가 누락되었습니다.`);
    this.name = 'ThemeInvalidError';
  }
}

function listThemes(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, 'theme.json')))
    .map((d) => d.name);
}

export function availableThemes({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const merged = loadEnv({ envPath, env });
  const customDir = (merged.PPT_THEME_DIR ?? '').trim();
  return {
    builtin: listThemes(BUILTIN_DIR),
    custom: customDir ? listThemes(path.resolve(customDir)) : [],
  };
}

export function loadTheme(name, { envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const { builtin, custom } = availableThemes({ envPath, env });
  const merged = loadEnv({ envPath, env });
  let themeDir = null;
  if (builtin.includes(name)) themeDir = path.join(BUILTIN_DIR, name);
  else if (custom.includes(name)) themeDir = path.join(path.resolve(merged.PPT_THEME_DIR.trim()), name);
  if (!themeDir) throw new ThemeNotFoundError(name, [...builtin, ...custom]);

  const theme = JSON.parse(readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
  const missing = LAYOUT_NAMES.filter((l) => !theme.layouts?.[l]);
  if (missing.length > 0) throw new ThemeInvalidError(name, missing);
  return { theme, themeDir };
}
