import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadTheme, availableThemes, ThemeNotFoundError, LAYOUT_NAMES } from '../../../../scripts/lib/ppt/load-theme.mjs';

test('내장 default-corporate 테마를 로드한다', () => {
  const { theme, themeDir } = loadTheme('default-corporate');
  assert.equal(theme.name, 'default-corporate');
  assert.ok(theme.colors.primary);
  assert.ok(themeDir.includes(path.join('skills', 'ppt-theme', 'themes', 'default-corporate')));
});

test('내장 테마는 레이아웃 8종을 모두 정의한다', () => {
  const { theme } = loadTheme('default-corporate');
  for (const name of LAYOUT_NAMES) {
    assert.ok(theme.layouts[name], `layouts.${name} 누락`);
  }
});

test('availableThemes는 themes 폴더의 테마 이름 목록을 돌려준다', () => {
  assert.ok(availableThemes().includes('default-corporate'));
});

test('없는 테마 이름이면 가능한 테마를 안내하며 실패한다', () => {
  assert.throws(
    () => loadTheme('no-such-theme'),
    (err) => {
      assert.ok(err instanceof ThemeNotFoundError);
      assert.match(err.message, /default-corporate/);
      return true;
    },
  );
});

test('themesDir를 주입하면 그 폴더의 커스텀 테마를 로드한다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ppt-themes-'));
  const custom = path.join(dir, 'my-corp');
  mkdirSync(custom, { recursive: true });
  const builtin = loadTheme('default-corporate').theme;
  writeFileSync(path.join(custom, 'theme.json'), JSON.stringify({ ...builtin, name: 'my-corp' }));
  const { theme } = loadTheme('my-corp', { themesDir: dir });
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
    () => loadTheme('broken', { themesDir: dir }),
    /레이아웃.*누락/,
  );
  rmSync(dir, { recursive: true, force: true });
});
