// tests/skills/ppt-theme/scripts/resolve-theme-dir.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveThemeDir } from '../../../../skills/ppt-theme/scripts/resolve-theme-dir.mjs';

const NO_ENV = path.join(tmpdir(), 'ppt-no-such.env');

test('PPT_THEME_DIR가 설정되어 있으면 절대 경로를 돌려준다', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'themes-'));
  const got = resolveThemeDir({ envPath: NO_ENV, env: { PPT_THEME_DIR: dir } });
  assert.equal(got, path.resolve(dir));
  rmSync(dir, { recursive: true, force: true });
});

test('미설정이면 null (내장 테마만 사용하는 정상 상태)', () => {
  assert.equal(resolveThemeDir({ envPath: NO_ENV, env: {} }), null);
});

test('required: true에서 미설정이면 설정 안내와 함께 실패한다', () => {
  assert.throws(
    () => resolveThemeDir({ envPath: NO_ENV, env: {}, required: true }),
    /PPT_THEME_DIR is not set/,
  );
});

test('설정됐지만 디렉터리가 아니면 실패한다', () => {
  const missing = path.join(tmpdir(), 'themes-missing-' + process.pid);
  assert.throws(
    () => resolveThemeDir({ envPath: NO_ENV, env: { PPT_THEME_DIR: missing } }),
    /not an existing directory/,
  );
});
