import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultBrowserCandidates, resolveBrowser } from '../skills/web-publisher-qa/scripts/screenshot.mjs';

test('win32 후보 목록은 Edge를 첫 번째로 둔다', () => {
  const list = defaultBrowserCandidates('win32', { 'ProgramFiles(x86)': 'C:\\PFx86', 'ProgramFiles': 'C:\\PF' });
  assert.match(list[0], /Microsoft\\Edge\\Application\\msedge\.exe$/);
  assert.ok(list.some((p) => /chrome\.exe$/.test(p)));
});

test('darwin 후보 목록은 .app 바이너리 경로를 포함한다', () => {
  const list = defaultBrowserCandidates('darwin', {});
  assert.ok(list.some((p) => p.includes('Google Chrome.app/Contents/MacOS')));
});

test('resolveBrowser는 존재하는 첫 후보를 고른다', () => {
  const candidates = ['/no/a', '/yes/b', '/yes/c'];
  const got = resolveBrowser({ candidates, exists: (p) => p.startsWith('/yes') });
  assert.equal(got, '/yes/b');
});

test('resolveBrowser는 후보가 하나도 없으면 null', () => {
  const got = resolveBrowser({ candidates: ['/no/a', '/no/b'], exists: () => false });
  assert.equal(got, null);
});
