// skills/ppt-theme/scripts/resolve-theme-dir.mjs
// PPT_THEME_DIR(.env, 선택값) 해석. 미설정은 정상(내장 테마만 사용) — required일 때만 실패.
import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadEnv, DEFAULT_ENV_PATH } from '../../../scripts/lib/load-env.mjs';

const VAR = 'PPT_THEME_DIR';

export function resolveThemeDir({ envPath = DEFAULT_ENV_PATH, env = process.env, required = false } = {}) {
  const merged = loadEnv({ envPath, env });
  const raw = (merged[VAR] ?? '').trim();
  if (!raw) {
    if (!required) return null;
    throw new Error(
      `${VAR} is not set. Add it to ${envPath} ` +
        `(e.g. ${VAR}=C:\\Users\\you\\ppt-themes) — 커스텀 테마 저장에 필요합니다.`,
    );
  }
  const dir = path.resolve(raw);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`${VAR} points to "${dir}", which is not an existing directory.`);
  }
  return dir;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const dir = resolveThemeDir({ required: process.argv.includes('--required') });
    process.stdout.write((dir ?? '(unset — builtin themes only)') + '\n');
  } catch (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }
}
