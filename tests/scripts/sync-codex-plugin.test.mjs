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
} from '../../scripts/sync-codex-plugin.mjs';

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
  assert.equal(bundle.get('scripts/lib/load-env.mjs').toString('utf8'), '// load');
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
  assert.equal(withEnv.get('.env').toString('utf8'), 'OPENAI_API_KEY=sk-test\n');
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
  assert.equal(bundle.get('skills/design-brand-kit/SKILL.md').toString('utf8'), '# brand');
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

test('write mode copies binary skill files byte-for-byte (no utf8 corruption)', () => {
  const skillsSrc = tmp();
  const bundleDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  // PNG 헤더 + 단독 0xff/0xfe/0x80 등 유효하지 않은 UTF-8 바이트 — utf8 왕복이면 손상된다.
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x00, 0x80, 0x7f]);
  mkdirSync(path.join(skillsSrc, 'design-brand-kit', 'references'), { recursive: true });
  writeFileSync(path.join(skillsSrc, 'design-brand-kit', 'references', 'brand-kit-example.png'), pngBytes);

  const w = syncBundle({ skillsSrc, bundleDir, mode: 'write', log: quiet });
  assert.equal(w.ok, true);

  const written = readFileSync(
    path.join(bundleDir, 'skills', 'design-brand-kit', 'references', 'brand-kit-example.png'),
  );
  assert.ok(written.equals(pngBytes), '번들된 PNG 바이트가 원본과 바이트 단위로 같아야 한다');

  // 바이너리도 드리프트 검사(byte 비교)가 통과해야 한다.
  const c = syncBundle({ skillsSrc, bundleDir, mode: 'check', log: quiet });
  assert.equal(c.ok, true);
  assert.deepEqual(c.failures, []);

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
