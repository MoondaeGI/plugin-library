import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildManifest,
  manifestText,
  collectFiles,
  buildBundle,
  syncBundle,
} from '../scripts/sync-codex-plugin.mjs';

const quiet = { log() {}, error() {} };

function tmp() {
  return mkdtempSync(path.join(tmpdir(), 'codex-plugin-'));
}

function makeSkill(skillsSrc, name, body) {
  mkdirSync(path.join(skillsSrc, name), { recursive: true });
  writeFileSync(path.join(skillsSrc, name, 'SKILL.md'), body, 'utf8');
}

test('buildManifest names the plugin and points skills at the bundled folder', () => {
  const m = buildManifest();
  assert.equal(m.name, 'personal');
  assert.equal(m.skills, './skills/');
  assert.match(manifestText(), /"skills": "\.\/skills\/"/);
});

test('collectFiles returns sorted relative paths and walks nested dirs', () => {
  const root = tmp();
  mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
  writeFileSync(path.join(root, 'z.md'), 'z', 'utf8');
  writeFileSync(path.join(root, 'a', 'm.md'), 'm', 'utf8');
  writeFileSync(path.join(root, 'a', 'b', 'deep.md'), 'd', 'utf8');
  const files = collectFiles(root).map((p) => p.split(path.sep).join('/'));
  assert.deepEqual(files, ['a/b/deep.md', 'a/m.md', 'z.md']);
  rmSync(root, { recursive: true, force: true });
});

function makeLib(libSrc, name, body) {
  mkdirSync(libSrc, { recursive: true });
  writeFileSync(path.join(libSrc, name), body, 'utf8');
}

test('buildBundle includes scripts/lib files when libSrc is given', () => {
  const skillsSrc = tmp();
  const libSrc = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeLib(libSrc, 'load-env.mjs', '// load');
  const bundle = buildBundle(skillsSrc, { libSrc });
  assert.equal(bundle.get('scripts/lib/load-env.mjs'), '// load');
  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(libSrc, { recursive: true, force: true });
});

test('buildBundle includes .env when envPath exists, omits when absent', () => {
  const skillsSrc = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  const envDir = tmp();
  const envPath = path.join(envDir, '.env');
  writeFileSync(envPath, 'OPENAI_API_KEY=sk-test\n', 'utf8');
  const withEnv = buildBundle(skillsSrc, { envPath });
  assert.equal(withEnv.get('.env'), 'OPENAI_API_KEY=sk-test\n');
  const noEnv = buildBundle(skillsSrc, { envPath: path.join(envDir, 'nope.env') });
  assert.equal(noEnv.has('.env'), false);
  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(envDir, { recursive: true, force: true });
});

test('write mode bundles lib + .env, check mode then passes', () => {
  const skillsSrc = tmp();
  const libSrc = tmp();
  const bundleDir = tmp();
  const envDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeLib(libSrc, 'load-env.mjs', '// load');
  const envPath = path.join(envDir, '.env');
  writeFileSync(envPath, 'OPENAI_API_KEY=sk-test\n', 'utf8');

  const w = syncBundle({ skillsSrc, libSrc, envPath, bundleDir, mode: 'write', log: quiet });
  assert.equal(w.ok, true);
  assert.equal(readFileSync(path.join(bundleDir, 'scripts', 'lib', 'load-env.mjs'), 'utf8'), '// load');
  assert.equal(readFileSync(path.join(bundleDir, '.env'), 'utf8'), 'OPENAI_API_KEY=sk-test\n');

  const c = syncBundle({ skillsSrc, libSrc, envPath, bundleDir, mode: 'check', log: quiet });
  assert.equal(c.ok, true);
  assert.deepEqual(c.failures, []);

  [skillsSrc, libSrc, bundleDir, envDir].forEach((d) => rmSync(d, { recursive: true, force: true }));
});

test('buildBundle mirrors skills under skills/ plus the manifest', () => {
  const skillsSrc = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  const bundle = buildBundle(skillsSrc);
  assert.ok(bundle.has('.codex-plugin/plugin.json'));
  assert.equal(bundle.get('skills/design-brand-kit/SKILL.md'), '# brand');
  rmSync(skillsSrc, { recursive: true, force: true });
});

test('write mode creates a self-contained bundle, check mode then passes', () => {
  const skillsSrc = tmp();
  const bundleDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeSkill(skillsSrc, 'design-page-image', '# page');

  const w = syncBundle({ skillsSrc, bundleDir, mode: 'write', log: quiet });
  assert.equal(w.ok, true);
  assert.ok(existsSync(path.join(bundleDir, '.codex-plugin', 'plugin.json')));
  assert.equal(
    readFileSync(path.join(bundleDir, 'skills', 'design-page-image', 'SKILL.md'), 'utf8'),
    '# page',
  );

  const c = syncBundle({ skillsSrc, bundleDir, mode: 'check', log: quiet });
  assert.equal(c.ok, true);
  assert.deepEqual(c.failures, []);

  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(bundleDir, { recursive: true, force: true });
});

test('check mode fails when a bundled skill is out of date', () => {
  const skillsSrc = tmp();
  const bundleDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand v1');
  syncBundle({ skillsSrc, bundleDir, mode: 'write', log: quiet });

  // Source changes but bundle not regenerated.
  makeSkill(skillsSrc, 'design-brand-kit', '# brand v2');
  const c = syncBundle({ skillsSrc, bundleDir, mode: 'check', log: quiet });
  assert.equal(c.ok, false);
  assert.ok(c.failures.some((f) => f.includes('design-brand-kit/SKILL.md')));

  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(bundleDir, { recursive: true, force: true });
});

test('write mode drops skills that no longer exist in the source', () => {
  const skillsSrc = tmp();
  const bundleDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeSkill(skillsSrc, 'old-skill', '# old');
  syncBundle({ skillsSrc, bundleDir, mode: 'write', log: quiet });
  assert.ok(existsSync(path.join(bundleDir, 'skills', 'old-skill', 'SKILL.md')));

  rmSync(path.join(skillsSrc, 'old-skill'), { recursive: true, force: true });
  syncBundle({ skillsSrc, bundleDir, mode: 'write', log: quiet });
  assert.equal(existsSync(path.join(bundleDir, 'skills', 'old-skill')), false);
  assert.ok(existsSync(path.join(bundleDir, 'skills', 'design-brand-kit', 'SKILL.md')));

  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(bundleDir, { recursive: true, force: true });
});
