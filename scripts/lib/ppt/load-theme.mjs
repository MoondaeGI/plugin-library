// 테마 이름 → theme.json 해석. 내장이든 커스텀이든 모두 skills/ppt-theme/themes/<이름>/에 둔다.
// (커스텀 테마도 이 repo에 커밋되어 머신 간 git로 따라온다 — 별도 PPT_THEME_DIR env 없음.)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { LAYOUTS } from './validate-spec.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');
const THEMES_DIR = path.join(PLUGIN_ROOT, 'skills', 'ppt-theme', 'themes');

// 레이아웃 8종 계약은 validate-spec.mjs의 LAYOUTS가 단일 권위.
// 여기서 파생시켜 두 모듈을 손으로 동기화할 일을 없앤다 (코드 리뷰 Important).
export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export class ThemeNotFoundError extends Error {
  constructor(name, available) {
    super(`테마 "${name}"를 찾을 수 없습니다. 사용 가능: ${available.join(', ') || '(없음)'}. ` +
      `커스텀 테마는 skills/ppt-theme/themes/<이름>/theme.json으로 둡니다.`);
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

// themesDir는 테스트 격리용 주입점 — 기본값은 실제 themes 폴더.
export function availableThemes({ themesDir = THEMES_DIR } = {}) {
  return listThemes(themesDir);
}

export function loadTheme(name, { themesDir = THEMES_DIR } = {}) {
  const available = availableThemes({ themesDir });
  if (!available.includes(name)) throw new ThemeNotFoundError(name, available);

  const themeDir = path.join(themesDir, name);
  const theme = JSON.parse(readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
  const missing = LAYOUT_NAMES.filter((l) => !theme.layouts?.[l]);
  if (missing.length > 0) throw new ThemeInvalidError(name, missing);
  return { theme, themeDir };
}
