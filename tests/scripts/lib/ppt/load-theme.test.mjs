import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadTheme, ThemeNotFoundError, LAYOUT_NAMES } from '../../../../scripts/lib/ppt/load-theme.mjs';

const NO_ENV = path.join(tmpdir(), 'ppt-no-such.env');

test('내장 default-corporate 테마를 로드한다', () => {
  const { theme, themeDir } = loadTheme('default-corporate', { envPath: NO_ENV, env: {} });
  assert.equal(theme.name, 'default-corporate');
  assert.ok(theme.colors.primary);
  assert.ok(themeDir.includes(path.join('skills', 'ppt-theme', 'themes', 'default-corporate')));
});

test('내장 테마는 레이아웃 8종을 모두 정의한다', () => {
  const { theme } = loadTheme('default-corporate', { envPath: NO_ENV, env: {} });
  for (const name of LAYOUT_NAMES) {
    assert.ok(theme.layouts[name], `layouts.${name} 누락`);
  }
});

test('없는 테마 이름이면 가능한 테마를 안내하며 실패한다', () => {
  assert.throws(
    () => loadTheme('no-such-theme', { envPath: NO_ENV, env: {} }),
    (err) => {
      assert.ok(err instanceof ThemeNotFoundError);
      assert.match(err.message, /default-corporate/);
      return true;
    },
  );
});

test('PPT_THEME_DIR의 커스텀 테마를 로드한다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ppt-themes-'));
  const custom = path.join(dir, 'my-corp');
  mkdirSync(custom, { recursive: true });
  const builtin = loadTheme('default-corporate', { envPath: NO_ENV, env: {} }).theme;
  writeFileSync(path.join(custom, 'theme.json'), JSON.stringify({ ...builtin, name: 'my-corp' }));
  const { theme } = loadTheme('my-corp', { envPath: NO_ENV, env: { PPT_THEME_DIR: dir } });
  assert.equal(theme.name, 'my-corp');
  rmSync(dir, { recursive: true, force: true });
});

test('테마에 레이아웃이 빠져 있으면 명시적으로 실패한다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ppt-themes-'));
  const broken = path.join(dir, 'broken');
  mkdirSync(broken, { recursive: true });
  writeFileSync(path.join(broken, 'theme.json'),
    JSON.stringify({ name: 'broken', colors: {}, fonts: {}, layouts: { title: {} } }));
  assert.throws(
    () => loadTheme('broken', { envPath: NO_ENV, env: { PPT_THEME_DIR: dir } }),
    /레이아웃.*누락/,
  );
  rmSync(dir, { recursive: true, force: true });
});
