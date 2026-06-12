# ppt 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** docs/superpowers/specs/2026-06-12/ppt-pipeline-design.md

**Goal:** "주제 → 자료·전략·페이지 설계 → spec.json → PptxGenJS 렌더 → COM PNG 검수" 파이프라인을 ppt-* 스킬 가족(plan/create/edit/theme)으로 구현한다.

**Architecture:** 덱 스펙(spec.json)을 단일 진실 소스로 두는 선언적 재생성 구조. 공유 스크립트(`scripts/lib/ppt/`)가 검증·렌더·검수 시트를 담당하고, 스킬 4종은 게이트 대화 산문이다. 테마는 theme.json 한 포맷으로 수렴(내장/커스텀).

**Tech Stack:** Node ESM(.mjs) + `pptxgenjs`(유일한 추가 의존성) + PowerShell COM(검수 PNG). 테스트는 `node --test`, 기존 `tests/` 미러 규칙.

**범위 제외(후속 계획):** potx 이식(`import-potx.mjs`) — 스펙 §9의 6단계 후반부. 이번 계획의 ppt-theme은 내장 열람·커스텀 저장까지만.

**참고할 기존 패턴:**
- env 변수 해석: `skills/librarian/scripts/resolve-vault.mjs` (+ 그 테스트) — `loadEnv()` 사용법·에러 문구·CLI entry 패턴의 원본.
- 테스트 스타일: `tests/skills/librarian/scripts/resolve-vault.test.mjs` — tmp 디렉터리 생성·정리, unit + CLI(spawnSync) 2단 구성.
- SKILL.md 작성 시 `superpowers:writing-skills` 사용(프로젝트 규칙). 스킬 추가 후 `npm run sync`(Codex 번들 재생성 — gitignore된 로컬 생성물이라 커밋 안 함).
- 커밋 메시지는 기존 로그 스타일: `feat(ppt): …` 한국어 제목.

---

### Task 1: pptxgenjs 의존성 추가

**Files:**
- Modify: `package.json` (dependencies 추가)

- [ ] **Step 1: 설치**

```powershell
npm install pptxgenjs
```

Expected: `package.json`에 `"dependencies": { "pptxgenjs": "^4.0.1" }` 생성, `package-lock.json` 갱신.

- [ ] **Step 2: 로드 스모크 확인**

```powershell
node -e "import('pptxgenjs').then(m => console.log(typeof m.default))"
```

Expected: `function`

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "feat(ppt): pptxgenjs 의존성 추가"
```

---

### Task 2: 덱 스펙 검증 모듈 (validate-spec.mjs)

레이아웃 8종의 필수/허용 필드와 글자 수 상한을 한 곳(레지스트리)에 정의하고, spec.json을 렌더 전에 검증한다. 오류는 슬라이드 번호·필드를 명시하는 커스텀 에러로.

**Files:**
- Create: `scripts/lib/ppt/validate-spec.mjs`
- Test: `tests/scripts/lib/ppt/validate-spec.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/scripts/lib/ppt/validate-spec.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec, SpecValidationError, LAYOUTS } from '../../../../scripts/lib/ppt/validate-spec.mjs';

function validSpec() {
  return {
    theme: 'default-corporate',
    slides: [
      { layout: 'title', fields: { title: '2분기 실적 보고', subtitle: '경영진 보고' } },
      { layout: 'bullets', fields: { title: '핵심 요약', bullets: ['매출 12% 성장', '신규 고객 34곳'] }, notes: '한 줄 메시지' },
      { layout: 'chart', fields: { title: '월별 매출', chartType: 'bar',
          data: [{ name: '매출', labels: ['4월', '5월', '6월'], values: [120, 135, 152] }] } },
    ],
  };
}

test('유효한 스펙은 통과한다', () => {
  assert.doesNotThrow(() => validateSpec(validSpec()));
});

test('레이아웃 8종이 레지스트리에 있다', () => {
  assert.deepEqual(
    Object.keys(LAYOUTS).sort(),
    ['bullets', 'chart', 'closing', 'image', 'section', 'table', 'title', 'two-col'],
  );
});

test('필수 필드 누락 시 슬라이드 번호와 필드를 명시한다', () => {
  const spec = validSpec();
  delete spec.slides[1].fields.title;
  assert.throws(() => validateSpec(spec), (err) => {
    assert.ok(err instanceof SpecValidationError);
    assert.match(err.message, /슬라이드 2/);
    assert.match(err.message, /title/);
    return true;
  });
});

test('알 수 없는 레이아웃을 거부한다', () => {
  const spec = validSpec();
  spec.slides[0].layout = 'fancy';
  assert.throws(() => validateSpec(spec), /슬라이드 1.*fancy/);
});

test('글자 수 상한을 넘으면 거부한다', () => {
  const spec = validSpec();
  spec.slides[0].fields.title = '가'.repeat(41); // title 상한 40
  assert.throws(() => validateSpec(spec), /슬라이드 1.*title.*40/);
});

test('bullets 개수 상한(7개)을 넘으면 거부한다', () => {
  const spec = validSpec();
  spec.slides[1].fields.bullets = Array.from({ length: 8 }, (_, i) => `항목 ${i}`);
  assert.throws(() => validateSpec(spec), /슬라이드 2.*bullets.*7/);
});

test('chart의 labels/values 길이 불일치를 거부한다', () => {
  const spec = validSpec();
  spec.slides[2].fields.data[0].values = [120, 135];
  assert.throws(() => validateSpec(spec), /슬라이드 3.*labels.*values/);
});

test('table의 행 길이가 columns와 다르면 거부한다', () => {
  const spec = validSpec();
  spec.slides.push({ layout: 'table', fields: { title: '비교', columns: ['항목', '값'], rows: [['속도', '빠름', '여분']] } });
  assert.throws(() => validateSpec(spec), /슬라이드 4.*rows\[0\]/);
});

test('slides가 비어 있으면 거부한다', () => {
  assert.throws(() => validateSpec({ theme: 'x', slides: [] }), /slides/);
});

test('검증은 원본 스펙을 변경하지 않는다', () => {
  const spec = validSpec();
  const snapshot = JSON.stringify(spec);
  validateSpec(spec);
  assert.equal(JSON.stringify(spec), snapshot);
});
```

- [ ] **Step 2: 실패 확인**

```powershell
node --test "tests/scripts/lib/ppt/validate-spec.test.mjs"
```

Expected: FAIL — `Cannot find module ... validate-spec.mjs`

- [ ] **Step 3: 구현**

```js
// scripts/lib/ppt/validate-spec.mjs
// 덱 스펙(spec.json)의 시스템 경계 검증. 레이아웃별 필드 계약의 단일 권위.

export class SpecValidationError extends Error {
  constructor(errors) {
    super(`덱 스펙 검증 실패:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    this.name = 'SpecValidationError';
    this.errors = errors;
  }
}

// field 타입: text(상한 글자수) | bullets(최대 개수, 항목 상한) | chartData | tableData | path
export const LAYOUTS = {
  title:   { required: { title: { type: 'text', max: 40 } },
             optional: { subtitle: { type: 'text', max: 60 }, date: { type: 'text', max: 20 } } },
  section: { required: { title: { type: 'text', max: 30 } },
             optional: { subtitle: { type: 'text', max: 60 } } },
  bullets: { required: { title: { type: 'text', max: 40 },
                         bullets: { type: 'bullets', maxItems: 7, maxLen: 90 } },
             optional: {} },
  'two-col': { required: { title: { type: 'text', max: 40 },
                           leftTitle: { type: 'text', max: 30 },
                           leftBullets: { type: 'bullets', maxItems: 5, maxLen: 70 },
                           rightTitle: { type: 'text', max: 30 },
                           rightBullets: { type: 'bullets', maxItems: 5, maxLen: 70 } },
               optional: {} },
  chart:   { required: { title: { type: 'text', max: 40 },
                         chartType: { type: 'enum', values: ['bar', 'line', 'pie'] },
                         data: { type: 'chartData' } },
             optional: {} },
  table:   { required: { title: { type: 'text', max: 40 },
                         columns: { type: 'bullets', maxItems: 6, maxLen: 20 },
                         rows: { type: 'tableData', maxRows: 10, maxCellLen: 40 } },
             optional: {} },
  image:   { required: { path: { type: 'path' } },
             optional: { title: { type: 'text', max: 40 }, caption: { type: 'text', max: 80 } } },
  closing: { required: { title: { type: 'text', max: 40 } },
             optional: { subtitle: { type: 'text', max: 60 } } },
};

const NOTES_MAX = 2000;

function checkField(errors, where, key, rule, value) {
  switch (rule.type) {
    case 'text':
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${where}: ${key}는 비어 있지 않은 문자열이어야 합니다`);
      } else if (value.length > rule.max) {
        errors.push(`${where}: ${key}가 ${value.length}자 — 상한 ${rule.max}자 초과`);
      }
      return;
    case 'enum':
      if (!rule.values.includes(value)) {
        errors.push(`${where}: ${key}는 ${rule.values.join('|')} 중 하나여야 합니다 (현재 "${value}")`);
      }
      return;
    case 'bullets':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: ${key}는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      if (value.length > rule.maxItems) {
        errors.push(`${where}: ${key}가 ${value.length}개 — 상한 ${rule.maxItems}개 초과`);
      }
      value.forEach((item, i) => {
        if (typeof item !== 'string' || item.length > rule.maxLen) {
          errors.push(`${where}: ${key}[${i}]가 문자열 ${rule.maxLen}자 이내가 아닙니다`);
        }
      });
      return;
    case 'chartData':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: data는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      value.forEach((series, i) => {
        if (!Array.isArray(series?.labels) || !Array.isArray(series?.values)) {
          errors.push(`${where}: data[${i}]에 labels/values 배열이 필요합니다`);
        } else if (series.labels.length !== series.values.length) {
          errors.push(`${where}: data[${i}]의 labels(${series.labels.length})와 values(${series.values.length}) 길이가 다릅니다`);
        }
      });
      return;
    case 'tableData': {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: rows는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      if (value.length > rule.maxRows) {
        errors.push(`${where}: rows가 ${value.length}행 — 상한 ${rule.maxRows}행 초과`);
      }
      return; // 행 길이 검증은 columns와 함께 validateSpec 본문에서
    }
    case 'path':
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${where}: ${key}는 이미지 파일 경로 문자열이어야 합니다`);
      }
      return;
    default:
      errors.push(`${where}: 알 수 없는 규칙 타입 ${rule.type}`);
  }
}

export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') throw new SpecValidationError(['spec이 객체가 아닙니다']);
  if (typeof spec.theme !== 'string' || spec.theme.trim() === '') errors.push('theme 이름이 필요합니다');
  if (!Array.isArray(spec.slides) || spec.slides.length === 0) {
    errors.push('slides는 비어 있지 않은 배열이어야 합니다');
    throw new SpecValidationError(errors);
  }

  spec.slides.forEach((slide, idx) => {
    const where = `슬라이드 ${idx + 1}`;
    const def = LAYOUTS[slide.layout];
    if (!def) {
      errors.push(`${where}: 알 수 없는 레이아웃 "${slide.layout}" (가능: ${Object.keys(LAYOUTS).join(', ')})`);
      return;
    }
    const fields = slide.fields ?? {};
    for (const [key, rule] of Object.entries(def.required)) {
      if (!(key in fields)) errors.push(`${where}: 필수 필드 ${key} 누락 (${slide.layout} 레이아웃)`);
      else checkField(errors, where, key, rule, fields[key]);
    }
    for (const [key, rule] of Object.entries(def.optional)) {
      if (key in fields) checkField(errors, where, key, rule, fields[key]);
    }
    const allowed = new Set([...Object.keys(def.required), ...Object.keys(def.optional)]);
    for (const key of Object.keys(fields)) {
      if (!allowed.has(key)) errors.push(`${where}: ${slide.layout} 레이아웃에 없는 필드 ${key}`);
    }
    if (slide.layout === 'table' && Array.isArray(fields.rows) && Array.isArray(fields.columns)) {
      fields.rows.forEach((row, r) => {
        if (!Array.isArray(row) || row.length !== fields.columns.length) {
          errors.push(`${where}: rows[${r}] 길이(${row?.length})가 columns 길이(${fields.columns.length})와 다릅니다`);
        } else {
          row.forEach((cell, c) => {
            if (typeof cell !== 'string' || cell.length > LAYOUTS.table.required.rows.maxCellLen) {
              errors.push(`${where}: rows[${r}][${c}]가 문자열 ${LAYOUTS.table.required.rows.maxCellLen}자 이내가 아닙니다`);
            }
          });
        }
      });
    }
    if ('notes' in slide && (typeof slide.notes !== 'string' || slide.notes.length > NOTES_MAX)) {
      errors.push(`${where}: notes는 문자열 ${NOTES_MAX}자 이내여야 합니다`);
    }
  });

  if (errors.length > 0) throw new SpecValidationError(errors);
}
```

- [ ] **Step 4: 통과 확인**

```powershell
node --test "tests/scripts/lib/ppt/validate-spec.test.mjs"
```

Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```powershell
git add scripts/lib/ppt/validate-spec.mjs tests/scripts/lib/ppt/validate-spec.test.mjs
git commit -m "feat(ppt): 덱 스펙 검증 모듈 — 레이아웃 8종 필드 계약"
```

---

### Task 3: 기본 테마 + 테마 로더 (load-theme.mjs)

내장 테마 `default-corporate`(보고용 무난한 16:9)와, 이름 → theme.json 해석기. 내장 디렉터리 우선, 없으면 `PPT_THEME_DIR`(선택 env) 검색.

**Files:**
- Create: `skills/ppt-theme/themes/default-corporate/theme.json`
- Create: `scripts/lib/ppt/load-theme.mjs`
- Test: `tests/scripts/lib/ppt/load-theme.test.mjs`

- [ ] **Step 1: 내장 테마 작성** (16:9 = 13.333×7.5in 좌표)

```json
{
  "name": "default-corporate",
  "colors": {
    "primary": "1A3E6E", "accent": "2E6FB7", "text": "2B2B2B",
    "muted": "6B7280", "background": "FFFFFF", "surface": "F3F5F8"
  },
  "fonts": { "heading": "맑은 고딕", "body": "맑은 고딕" },
  "layouts": {
    "title": {
      "backgroundColor": "1A3E6E",
      "placeholders": {
        "title":    { "x": 0.9, "y": 2.6, "w": 11.5, "h": 1.4, "fontSize": 40, "bold": true, "color": "FFFFFF" },
        "subtitle": { "x": 0.9, "y": 4.1, "w": 11.5, "h": 0.8, "fontSize": 20, "color": "C9D6E8" },
        "date":     { "x": 0.9, "y": 6.4, "w": 5.0,  "h": 0.5, "fontSize": 14, "color": "C9D6E8" }
      }
    },
    "section": {
      "backgroundColor": "F3F5F8",
      "placeholders": {
        "title":    { "x": 0.9, "y": 3.0, "w": 11.5, "h": 1.2, "fontSize": 34, "bold": true, "color": "1A3E6E" },
        "subtitle": { "x": 0.9, "y": 4.3, "w": 11.5, "h": 0.7, "fontSize": 18, "color": "6B7280" }
      }
    },
    "bullets": {
      "placeholders": {
        "title": { "x": 0.7, "y": 0.5, "w": 12.0, "h": 0.9, "fontSize": 28, "bold": true, "color": "1A3E6E" },
        "body":  { "x": 0.9, "y": 1.8, "w": 11.5, "h": 5.0, "fontSize": 18, "color": "2B2B2B" }
      }
    },
    "two-col": {
      "placeholders": {
        "title":        { "x": 0.7, "y": 0.5, "w": 12.0, "h": 0.9, "fontSize": 28, "bold": true, "color": "1A3E6E" },
        "leftTitle":    { "x": 0.9, "y": 1.7, "w": 5.6, "h": 0.6, "fontSize": 20, "bold": true, "color": "2E6FB7" },
        "leftBullets":  { "x": 0.9, "y": 2.5, "w": 5.6, "h": 4.3, "fontSize": 16, "color": "2B2B2B" },
        "rightTitle":   { "x": 6.9, "y": 1.7, "w": 5.6, "h": 0.6, "fontSize": 20, "bold": true, "color": "2E6FB7" },
        "rightBullets": { "x": 6.9, "y": 2.5, "w": 5.6, "h": 4.3, "fontSize": 16, "color": "2B2B2B" }
      }
    },
    "chart": {
      "placeholders": { "title": { "x": 0.7, "y": 0.5, "w": 12.0, "h": 0.9, "fontSize": 28, "bold": true, "color": "1A3E6E" } },
      "contentBox": { "x": 0.9, "y": 1.7, "w": 11.5, "h": 5.2 }
    },
    "table": {
      "placeholders": { "title": { "x": 0.7, "y": 0.5, "w": 12.0, "h": 0.9, "fontSize": 28, "bold": true, "color": "1A3E6E" } },
      "contentBox": { "x": 0.9, "y": 1.8, "w": 11.5, "h": 5.0 }
    },
    "image": {
      "placeholders": {
        "title":   { "x": 0.7, "y": 0.5, "w": 12.0, "h": 0.9, "fontSize": 28, "bold": true, "color": "1A3E6E" },
        "caption": { "x": 0.9, "y": 6.7, "w": 11.5, "h": 0.5, "fontSize": 14, "color": "6B7280" }
      },
      "contentBox": { "x": 1.7, "y": 1.7, "w": 10.0, "h": 4.8 }
    },
    "closing": {
      "backgroundColor": "1A3E6E",
      "placeholders": {
        "title":    { "x": 0.9, "y": 3.0, "w": 11.5, "h": 1.2, "fontSize": 36, "bold": true, "color": "FFFFFF" },
        "subtitle": { "x": 0.9, "y": 4.3, "w": 11.5, "h": 0.7, "fontSize": 18, "color": "C9D6E8" }
      }
    }
  }
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

```js
// tests/scripts/lib/ppt/load-theme.test.mjs
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
```

- [ ] **Step 3: 실패 확인**

```powershell
node --test "tests/scripts/lib/ppt/load-theme.test.mjs"
```

Expected: FAIL — `Cannot find module ... load-theme.mjs`

- [ ] **Step 4: 구현**

```js
// scripts/lib/ppt/load-theme.mjs
// 테마 이름 → theme.json 해석. 내장(skills/ppt-theme/themes/) 우선, 다음 PPT_THEME_DIR.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv, DEFAULT_ENV_PATH } from '../load-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');
const BUILTIN_DIR = path.join(PLUGIN_ROOT, 'skills', 'ppt-theme', 'themes');

export const LAYOUT_NAMES = ['title', 'section', 'bullets', 'two-col', 'chart', 'table', 'image', 'closing'];

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
```

- [ ] **Step 5: 통과 확인**

```powershell
node --test "tests/scripts/lib/ppt/load-theme.test.mjs"
```

Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```powershell
git add skills/ppt-theme/themes/default-corporate/theme.json scripts/lib/ppt/load-theme.mjs tests/scripts/lib/ppt/load-theme.test.mjs
git commit -m "feat(ppt): 기본 테마 default-corporate와 테마 로더"
```

---

### Task 4: 렌더러 (render-deck.mjs)

spec.json + theme.json → deck.pptx. 텍스트형 레이아웃은 theme의 placeholders 좌표로 데이터 주도 렌더, chart/table/image는 contentBox에 특수 처리. CLI: `node scripts/lib/ppt/render-deck.mjs <덱 디렉터리>`.

**Files:**
- Create: `scripts/lib/ppt/render-deck.mjs`
- Test: `tests/scripts/lib/ppt/render-deck.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/scripts/lib/ppt/render-deck.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderDeck } from '../../../../scripts/lib/ppt/render-deck.mjs';
import { SpecValidationError } from '../../../../scripts/lib/ppt/validate-spec.mjs';

const NO_ENV = path.join(tmpdir(), 'ppt-no-such.env');

function makeDeckDir(spec) {
  const dir = mkdtempSync(path.join(tmpdir(), 'deck-'));
  writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  return dir;
}

const SPEC = {
  theme: 'default-corporate',
  slides: [
    { layout: 'title', fields: { title: '렌더 스모크', subtitle: '테스트' }, notes: '발표자 노트' },
    { layout: 'bullets', fields: { title: '요약', bullets: ['하나', '둘'] } },
    { layout: 'chart', fields: { title: '추이', chartType: 'bar',
        data: [{ name: '값', labels: ['a', 'b'], values: [1, 2] }] } },
    { layout: 'table', fields: { title: '비교', columns: ['항목', '값'], rows: [['속도', '빠름']] } },
    { layout: 'closing', fields: { title: '감사합니다' } },
  ],
};

test('스펙 5장이 deck.pptx로 렌더된다 (슬라이드 수 일치)', async () => {
  const dir = makeDeckDir(SPEC);
  const out = await renderDeck(dir, { envPath: NO_ENV, env: {} });
  assert.equal(out, path.join(dir, 'deck.pptx'));
  assert.ok(existsSync(out));
  const buf = readFileSync(out).toString('latin1'); // pptx는 zip — 엔트리 이름이 평문으로 존재
  assert.ok(buf.includes('ppt/slides/slide5.xml'), '5번 슬라이드가 있어야 함');
  assert.ok(!buf.includes('ppt/slides/slide6.xml'), '6번 슬라이드는 없어야 함');
  rmSync(dir, { recursive: true, force: true });
});

test('렌더는 결정적이다 — 같은 스펙 2회 렌더 결과의 슬라이드 XML이 같다', async () => {
  const dir = makeDeckDir(SPEC);
  await renderDeck(dir, { envPath: NO_ENV, env: {} });
  const first = readFileSync(path.join(dir, 'deck.pptx'));
  await renderDeck(dir, { envPath: NO_ENV, env: {} });
  const second = readFileSync(path.join(dir, 'deck.pptx'));
  // zip 메타(타임스탬프)는 다를 수 있으니 파일 크기 동일성으로 스모크 확인
  assert.equal(first.length, second.length);
  rmSync(dir, { recursive: true, force: true });
});

test('잘못된 스펙이면 SpecValidationError로 실패한다', async () => {
  const dir = makeDeckDir({ theme: 'default-corporate', slides: [{ layout: 'title', fields: {} }] });
  await assert.rejects(() => renderDeck(dir, { envPath: NO_ENV, env: {} }), SpecValidationError);
  rmSync(dir, { recursive: true, force: true });
});

test('spec.json이 없으면 안내하며 실패한다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'deck-'));
  await assert.rejects(() => renderDeck(dir, { envPath: NO_ENV, env: {} }), /spec\.json/);
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: 실패 확인**

```powershell
node --test "tests/scripts/lib/ppt/render-deck.test.mjs"
```

Expected: FAIL — `Cannot find module ... render-deck.mjs`

- [ ] **Step 3: 구현**

```js
// scripts/lib/ppt/render-deck.mjs
// spec.json + theme.json → deck.pptx (PptxGenJS). 결정적 렌더 — 같은 입력, 같은 출력.
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import { validateSpec } from './validate-spec.mjs';
import { loadTheme } from './load-theme.mjs';

export class DeckDirError extends Error {
  constructor(deckDir) {
    super(`${deckDir}에 spec.json이 없습니다. ppt-plan → ppt-create 순서로 진행했는지 확인하세요.`);
    this.name = 'DeckDirError';
  }
}

const FONT = (theme, kind) => theme.fonts[kind] ?? theme.fonts.body;

function addPlaceholderText(slide, theme, ph, text, extra = {}) {
  slide.addText(text, {
    x: ph.x, y: ph.y, w: ph.w, h: ph.h,
    fontSize: ph.fontSize, bold: ph.bold ?? false,
    color: ph.color ?? theme.colors.text,
    fontFace: ph.bold ? FONT(theme, 'heading') : FONT(theme, 'body'),
    fit: 'shrink', valign: 'top', ...extra,
  });
}

function bulletsText(items) {
  return items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } }));
}

// 레이아웃별 채움 함수 — placeholders는 텍스트, contentBox는 차트/표/이미지
const RENDERERS = {
  title(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
    if (f.date) addPlaceholderText(slide, theme, L.placeholders.date, f.date);
  },
  section(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
  },
  bullets(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    addPlaceholderText(slide, theme, L.placeholders.body, bulletsText(f.bullets));
  },
  'two-col'(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    addPlaceholderText(slide, theme, L.placeholders.leftTitle, f.leftTitle);
    addPlaceholderText(slide, theme, L.placeholders.leftBullets, bulletsText(f.leftBullets));
    addPlaceholderText(slide, theme, L.placeholders.rightTitle, f.rightTitle);
    addPlaceholderText(slide, theme, L.placeholders.rightBullets, bulletsText(f.rightBullets));
  },
  chart(slide, f, L, theme, pptx) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const kind = { bar: pptx.charts.BAR, line: pptx.charts.LINE, pie: pptx.charts.PIE }[f.chartType];
    slide.addChart(kind, f.data, {
      ...L.contentBox,
      chartColors: [theme.colors.primary, theme.colors.accent, theme.colors.muted],
      showLegend: f.data.length > 1, legendPos: 'b', showValue: true,
    });
  },
  table(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const header = f.columns.map((c) => ({
      text: c, options: { bold: true, color: 'FFFFFF', fill: { color: theme.colors.primary } },
    }));
    slide.addTable([header, ...f.rows], {
      ...L.contentBox, fontFace: FONT(theme, 'body'), fontSize: 14,
      border: { pt: 0.5, color: theme.colors.muted }, valign: 'middle',
    });
  },
  image(slide, f, L, theme, _pptx, deckDir) {
    if (f.title) addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const imgPath = path.isAbsolute(f.path) ? f.path : path.resolve(deckDir, f.path);
    if (!existsSync(imgPath)) throw new Error(`image 슬라이드의 파일이 없습니다: ${imgPath}`);
    slide.addImage({ path: imgPath, ...L.contentBox, sizing: { type: 'contain', w: L.contentBox.w, h: L.contentBox.h } });
    if (f.caption) addPlaceholderText(slide, theme, L.placeholders.caption, f.caption, { align: 'center' });
  },
  closing(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
  },
};

export async function renderDeck(deckDir, { envPath, env } = {}) {
  const specPath = path.join(deckDir, 'spec.json');
  if (!existsSync(specPath)) throw new DeckDirError(deckDir);
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  validateSpec(spec);
  const { theme, themeDir } = loadTheme(spec.theme, { envPath, env });

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE';

  for (const slideSpec of spec.slides) {
    const L = theme.layouts[slideSpec.layout];
    const slide = pptx.addSlide();
    if (L.background) slide.background = { path: path.resolve(themeDir, L.background) };
    else slide.background = { color: L.backgroundColor ?? theme.colors.background };
    RENDERERS[slideSpec.layout](slide, slideSpec.fields, L, theme, pptx, deckDir);
    if (slideSpec.notes) slide.addNotes(slideSpec.notes);
  }

  const outPath = path.join(deckDir, 'deck.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const deckDir = process.argv[2];
  if (!deckDir) {
    process.stderr.write('사용법: node scripts/lib/ppt/render-deck.mjs <덱 디렉터리>\n');
    process.exit(1);
  }
  renderDeck(path.resolve(deckDir))
    .then((out) => process.stdout.write(out + '\n'))
    .catch((err) => { process.stderr.write(err.message + '\n'); process.exit(1); });
}
```

- [ ] **Step 4: 통과 확인**

```powershell
node --test "tests/scripts/lib/ppt/render-deck.test.mjs"
```

Expected: PASS (4 tests)

- [ ] **Step 5: 눈 확인 (수동)** — 샘플 덱을 만들어 PowerPoint에서 열어본다

```powershell
New-Item -ItemType Directory -Force .slides\smoke | Out-Null
@'
{ "theme": "default-corporate", "slides": [
  { "layout": "title", "fields": { "title": "파이프라인 스모크", "subtitle": "render-deck 확인" } },
  { "layout": "bullets", "fields": { "title": "확인 항목", "bullets": ["제목 위치", "불릿 들여쓰기", "폰트"] } },
  { "layout": "chart", "fields": { "title": "샘플 차트", "chartType": "bar", "data": [{ "name": "값", "labels": ["A","B","C"], "values": [3,5,2] }] } }
] }
'@ | Out-File -Encoding utf8 .slides\smoke\spec.json
node scripts/lib/ppt/render-deck.mjs .slides\smoke
Invoke-Item .slides\smoke\deck.pptx
```

Expected: PowerPoint에서 3장 덱이 열리고 제목·불릿·차트가 테마 색으로 보인다. 확인 후 닫기. (`.slides/`는 루트 `.gitignore`에 추가 — Task 5에서.)

- [ ] **Step 6: Commit**

```powershell
git add scripts/lib/ppt/render-deck.mjs tests/scripts/lib/ppt/render-deck.test.mjs
git commit -m "feat(ppt): spec+theme → pptx 렌더러"
```

---

### Task 5: .gitignore + 검수 스크립트 (export-png.ps1)

`.slides/` 작업물은 덱이 만들어지는 대상 폴더의 산출물이라 이 repo에서는 무시 대상(스모크용). COM export는 자동 테스트 불가 — 수동 검증 단계 포함.

**Files:**
- Modify: `.gitignore` (루트)
- Create: `scripts/lib/ppt/export-png.ps1`

- [ ] **Step 1: .gitignore에 .slides/ 추가**

`.gitignore` 끝에 추가:

```
# ppt 파이프라인 스모크 산출물
.slides/
```

- [ ] **Step 2: export-png.ps1 작성**

```powershell
# scripts/lib/ppt/export-png.ps1
# 생성된 .pptx를 PowerPoint COM의 Slide.Export로 슬라이드별 PNG로 내보낸다 (스크린샷 아님).
# 사용법: powershell -File scripts/lib/ppt/export-png.ps1 -PptxPath .slides\my-deck\deck.pptx
param(
  [Parameter(Mandatory = $true)][string]$PptxPath,
  [string]$OutDir,
  [int]$Width = 1280
)
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PptxPath)) { Write-Error "pptx가 없습니다: $PptxPath"; exit 1 }
$pptxFull = (Resolve-Path $PptxPath).Path
if (-not $OutDir) { $OutDir = Join-Path (Split-Path $pptxFull -Parent) 'review' }
New-Item -ItemType Directory -Force $OutDir | Out-Null
$outFull = (Resolve-Path $OutDir).Path
Get-ChildItem $outFull -Filter 'slide-*.png' | Remove-Item -Force

try {
  $app = New-Object -ComObject PowerPoint.Application
} catch {
  Write-Error "PowerPoint COM을 사용할 수 없습니다 (미설치?). deck.pptx는 정상이며, 검수만 수동으로 진행하세요."
  exit 2
}

try {
  # Open(FileName, ReadOnly, Untitled, WithWindow) — 창 없이 읽기 전용으로
  $pres = $app.Presentations.Open($pptxFull, $true, $false, $false)
  $h = [int]($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)
  foreach ($slide in $pres.Slides) {
    $png = Join-Path $outFull ('slide-{0:D2}.png' -f $slide.SlideIndex)
    $slide.Export($png, 'PNG', $Width, $h)
  }
  $count = $pres.Slides.Count
  $pres.Close()
  Write-Output "$count 장 export 완료 → $outFull"
} finally {
  $app.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
```

- [ ] **Step 3: 수동 검증** (Task 4의 스모크 덱 사용)

```powershell
powershell -File scripts/lib/ppt/export-png.ps1 -PptxPath .slides\smoke\deck.pptx
Get-ChildItem .slides\smoke\review
```

Expected: `slide-01.png slide-02.png slide-03.png` 3개, "3 장 export 완료" 출력. PNG를 열어 슬라이드와 동일한지 확인.

- [ ] **Step 4: Commit**

```powershell
git add .gitignore scripts/lib/ppt/export-png.ps1
git commit -m "feat(ppt): PowerPoint COM 슬라이드 PNG 검수 스크립트"
```

---

### Task 6: ppt-create 스킬

코어 루프 스킬. **`superpowers:writing-skills`를 사용해 작성**하고, 아래 초안을 출발점으로 한다 (산문 상세는 writing-skills에서 다듬되 골격·경로·게이트는 유지).

**Files:**
- Create: `skills/ppt-create/SKILL.md`

- [ ] **Step 1: SKILL.md 작성** (writing-skills 사용, 아래가 초안)

```markdown
---
name: ppt-create
description: 합의된 outline.md를 받아 PPT 덱을 생산하는 코어 스킬. 슬라이드별 내용 초안 작성 → .slides/<덱>/spec.json(단일 진실 소스) → render-deck.mjs로 결정적 렌더 → export-png.ps1로 슬라이드별 PNG 검수 시트 → "3번 고쳐" 수정 루프 → lock. outline.md가 없으면 ppt-plan으로 유도한다. 테마는 시작 시 1회 선택(내장 default-corporate 또는 PPT_THEME_DIR의 커스텀). 생성된 deck.pptx는 빌드 산출물 — 손편집 금지, 모든 수정은 spec 경유.
---

# PPT Create

당신은 합의된 발표 기획(outline.md)을 실제 .pptx 파일로 만드는 덱 프로듀서다. 무게중심은 이미 ppt-plan에서 끝났다 — 여기서는 기계적으로 만들고, 눈으로 검수한다.

## 전제

- `.slides/<덱-슬러그>/outline.md`가 있어야 한다. 없으면 **ppt-plan부터** 진행하도록 안내하고 멈춘다.
- 의존성: `pptxgenjs` (이 플러그인 repo에 설치됨). 렌더 스크립트는 플러그인의 `scripts/lib/ppt/`.

## 진행

1. **테마 선택(1회)**: 내장 + `PPT_THEME_DIR` 커스텀 테마 목록을 보여주고 택1. 기본 추천은 `default-corporate`.
2. **내용 초안**: outline.md의 페이지별 한 줄 메시지·근거를 슬라이드 내용으로 번역해 `spec.json` 작성. 레이아웃은 내용에 맞게 배정(불릿/차트/표/2단…). 페이지별 메시지는 해당 슬라이드의 `notes`(발표자 노트)에 기본 탑재.
3. **렌더**: `node <플러그인루트>/scripts/lib/ppt/render-deck.mjs .slides/<덱>` — 검증 실패 시 에러 메시지(슬라이드 번호·필드)를 보고 spec을 고친다.
4. **검수 게이트**: `powershell -File <플러그인루트>/scripts/lib/ppt/export-png.ps1 -PptxPath .slides/<덱>/deck.pptx` → `review/slide-*.png`를 먼저 직접 읽고 오버플로·겹침·어색한 줄바꿈을 자가 수정한 뒤, 사용자에게 번호와 함께 제시.
5. **수정 루프**: 사용자의 "N번 ~게 고쳐"를 spec.json 수정으로 번역 → 재렌더 → 바뀐 슬라이드 PNG만 다시 제시. 렌더는 결정적이라 안 고친 슬라이드는 변하지 않는다.
6. **lock**: 사용자가 승인하면 완료. deck.pptx 경로를 알려준다.

## 산출물

\`\`\`
.slides/<덱-슬러그>/
  spec.json    # 단일 진실 소스
  deck.pptx    # 빌드 산출물 (손편집 금지)
  review/      # slide-NN.png 검수 이미지
\`\`\`

## 레이아웃 8종 (spec의 layout 값)

title · section · bullets · two-col · chart · table · image · closing — 필드 계약은 `scripts/lib/ppt/validate-spec.mjs`의 `LAYOUTS`가 권위.

## 주의

- PowerPoint COM이 없으면(비Windows·미설치) export는 안내 후 스킵 — deck.pptx는 정상 산출, 검수는 사용자가 직접 연다.
- spec의 글자 수 상한을 넘는 내용은 줄이는 쪽으로 — 늘어난 박스가 아니라 짧은 문장이 좋은 슬라이드다.
```

- [ ] **Step 2: sync로 Codex 번들 재생성**

```powershell
npm run sync
```

Expected: 에러 없이 완료 (`plugins/personal/` 재생성 — gitignore, 커밋 안 함).

- [ ] **Step 3: Commit**

```powershell
git add skills/ppt-create/SKILL.md
git commit -m "feat(ppt-create): 덱 생산 코어 스킬 신설"
```

---

### Task 7: ppt-plan 스킬

파이프라인에서 가장 큰 스킬 — 자료·전략·페이지 설계. 스크립트 없음, 산문 위주. **writing-skills 사용**, 아래가 초안.

**Files:**
- Create: `skills/ppt-plan/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

```markdown
---
name: ppt-plan
description: "xxx 주제로 PPT 만들고 싶어"에서 출발해 자료 확보 → 발표 전략 → 페이지 설계를 논의로 확정하는 스킬. 산출물은 .slides/<덱-슬러그>/outline.md (페이지 수·페이지별 한 줄 메시지·근거). 자료는 ①기존 자료 소화 ②세션 웹 검색 약식 조사 ③인터뷰로 끌어내기 중 상황에 맞게. 발표 전략 상담만 받고 끝나도 된다. 다음 단계는 ppt-create.
---

# PPT Plan

당신은 발표 기획 파트너다. PPT 만들기의 8할은 "뭘 말할 것인가"고, 그걸 여기서 끝낸다. 파일 제작은 ppt-create의 몫.

## 진행 — 게이트 3개

### 게이트 1: 자료

주제를 들으면 먼저 자료의 출처를 정한다:
- **자료가 있다** → 받아서 읽고 소화. 핵심 주장·숫자·구조를 요약해 보여주고 확인받는다.
- **조사가 필요하다** → 깊은 조사 스킬(예: deep-research)이 세션에 있으면 위임, 없으면 세션 자체 웹 검색으로 약식 조사. 그것도 안 되면 자료 요청.
- **머릿속에 있다** → 인터뷰로 끌어낸다: "핵심 주장이 뭔가요? 근거는? 예상 반론은?"

### 게이트 2: 발표 전략

자료를 깔고 한 번에 하나씩 합의한다:
- 청중이 누구고 무엇을 이미 아는가
- 발표 후 청중이 무엇을 하게 만들고 싶은가 (목적)
- **핵심 메시지 한 문장** — 이게 안 나오면 다음으로 못 간다
- 설득 구조: 두괄식 보고 / 문제→해결 / 비교 / 연대기 중 택1 (청중·목적에 맞게 추천)
- 시간·분량 제약

### 게이트 3: 페이지 설계

전략을 페이지로 번역해 제안하고 합의한다:
- 담을 것과 버릴 것 (자료의 어느 부분을 쓰는지)
- 페이지 수와 순서
- **페이지별 한 줄 메시지** + 그 페이지에 들어갈 근거·데이터·(차트라면) 어떤 차트

합의되면 `.slides/<덱-슬러그>/outline.md`로 저장한다. 슬러그는 주제 기반 kebab-case로 제안해 확인받는다.

## outline.md 형식

\`\`\`markdown
# <발표 제목>
- 목적: … / 청중: … / 분량: N장·M분
- 핵심 메시지: "…"
- 구조: 두괄식 보고

1. [title] <표지 제목>
2. [bullets] 핵심 요약 — "메시지 한 줄" · 근거: …
3. [chart] 월별 추이 — "메시지 한 줄" · bar, 데이터: …
…
\`\`\`

페이지의 `[레이아웃]` 표기는 ppt-create의 레이아웃 8종(title·section·bullets·two-col·chart·table·image·closing)을 쓴다 — 미정이면 비워두고 create에서 배정.

## 끝나는 방식 두 가지

- outline.md 저장 후 "ppt-create로 넘어갈까요?" — 보통 경로.
- 전략 상담만 원했다면 outline 없이 논의로 끝나도 된다.
```

- [ ] **Step 2: sync**

```powershell
npm run sync
```

- [ ] **Step 3: Commit**

```powershell
git add skills/ppt-plan/SKILL.md
git commit -m "feat(ppt-plan): 자료·전략·페이지 설계 기획 스킬 신설"
```

---

### Task 8: ppt-edit 스킬

기존 덱 재진입용 얇은 스킬. create의 기계(render·export) 재사용. **writing-skills 사용**, 아래가 초안.

**Files:**
- Create: `skills/ppt-edit/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

```markdown
---
name: ppt-edit
description: 이전에 만든 PPT 덱(.slides/<덱>/spec.json이 있는)을 다시 열어 수정할 때 사용. "그 보고서 3번 슬라이드 숫자 바꿔줘" 류의 재진입. 수정 요청을 spec.json 변경으로 번역 → render-deck.mjs 재렌더 → 바뀐 슬라이드만 PNG 재검수. 렌더는 결정적이라 안 고친 슬라이드는 변하지 않는다. deck.pptx를 직접 고치지 않는다(빌드 산출물). 새 덱은 ppt-plan/ppt-create.
---

# PPT Edit

기존 덱의 수정 재진입. 모든 수정은 spec.json을 거친다 — pptx 손편집 금지.

## 진행

1. **덱 찾기**: cwd의 `.slides/` 아래 덱 목록을 보여주고 대상 확정. spec.json이 없으면 "이 덱은 이 파이프라인 산출물이 아니다"라고 안내(역가져오기는 비범위).
2. **수정 번역**: 사용자의 요청("3번 제목 바꿔", "차트를 선그래프로")을 spec.json의 해당 슬라이드 필드 수정으로 번역. 내용 추가/삭제/순서 변경도 slides 배열 조작으로.
3. **재렌더·검수**: `render-deck.mjs` → `export-png.ps1` → **바뀐 슬라이드의 PNG만** 제시. 추가 수정 요청은 2로 루프.
4. **완료**: 승인 시 deck.pptx 경로 안내.

## 주의

- 사용자가 pptx를 PowerPoint에서 직접 고쳤을 가능성이 보이면(파일 수정 시각이 spec보다 최신) 경고: 재렌더가 손편집을 덮어쓴다. 진행 전 확인받는다.
- 레이아웃·필드 계약은 `scripts/lib/ppt/validate-spec.mjs`의 `LAYOUTS`가 권위.
```

- [ ] **Step 2: sync + Commit**

```powershell
npm run sync
git add skills/ppt-edit/SKILL.md
git commit -m "feat(ppt-edit): 기존 덱 수정 재진입 스킬 신설"
```

---

### Task 9: ppt-theme 스킬 (내장 열람·커스텀 저장 — potx 이식은 후속 계획)

테마 디렉터리 해석 스크립트(TDD) + 스킬 산문. **writing-skills 사용**.

**Files:**
- Create: `skills/ppt-theme/scripts/resolve-theme-dir.mjs`
- Create: `skills/ppt-theme/SKILL.md`
- Test: `tests/skills/ppt-theme/scripts/resolve-theme-dir.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
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
```

- [ ] **Step 2: 실패 확인**

```powershell
node --test "tests/skills/ppt-theme/scripts/resolve-theme-dir.test.mjs"
```

Expected: FAIL — `Cannot find module ... resolve-theme-dir.mjs`

- [ ] **Step 3: 구현** (resolve-vault.mjs 패턴)

```js
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
```

- [ ] **Step 4: 통과 확인**

```powershell
node --test "tests/skills/ppt-theme/scripts/resolve-theme-dir.test.mjs"
```

Expected: PASS (4 tests)

- [ ] **Step 5: SKILL.md 작성**

```markdown
---
name: ppt-theme
description: ppt 파이프라인의 테마를 관리하는 스킬 — 내장 테마 열람, 색·폰트·좌표를 손본 커스텀 테마를 PPT_THEME_DIR에 저장. 테마는 theme.json 한 포맷(colors·fonts·layouts 8종 좌표)이며 ppt-create가 이름으로 읽는다. 덱 작업과 별개 주기로 가끔 사용. potx 이식(회사 공식 템플릿 가져오기)은 추후 추가 예정 — 아직 없다.
---

# PPT Theme

테마(theme.json)의 열람·저작. 파이프라인 본체(ppt-plan/create)와 직교 — 여기서 만든 테마를 create가 이름으로 소비한다.

## 테마 위치 2곳

- **내장**: `skills/ppt-theme/themes/<이름>/theme.json` (플러그인 번들, 수정하지 않음)
- **커스텀**: `.env`의 `PPT_THEME_DIR` 아래 `<이름>/theme.json` (머신 로컬). 미설정이면 내장만 사용 가능 — 커스텀 저장 요청 시 `scripts/resolve-theme-dir.mjs --required`의 안내대로 설정을 돕는다.

## 할 수 있는 일

1. **열람**: 내장·커스텀 테마 목록과 각 테마의 색·폰트를 보여준다.
2. **커스텀 저작**: 내장 테마를 베이스로 색·폰트·좌표를 사용자와 합의해 바꾸고, `PPT_THEME_DIR/<새이름>/theme.json`으로 저장. 저장 전 그 테마로 3장짜리 샘플 spec을 렌더(render-deck.mjs)→PNG export로 미리보기를 보여 확인받는다.
3. **검증**: theme.json은 레이아웃 8종(title·section·bullets·two-col·chart·table·image·closing)을 모두 정의해야 한다 — 누락 시 load-theme.mjs가 거부한다.

## 비범위 (아직)

- potx 이식(회사 템플릿 → theme.json 변환)은 후속 구현 예정. 요청받으면 "아직 없고, 색·폰트를 알려주시면 커스텀 테마로 수동 제작 가능"이라고 안내.
```

- [ ] **Step 6: sync + 전체 테스트 + Commit**

```powershell
npm run sync
npm test
git add skills/ppt-theme tests/skills/ppt-theme
git commit -m "feat(ppt-theme): 테마 열람·커스텀 저장 스킬 신설"
```

Expected: `npm test` 전체 PASS (기존 테스트 포함).

---

### Task 10: 엔드투엔드 수동 검증 + 문서 정리

- [ ] **Step 1: 플러그인 리로드 후 실사용 1회**

`claude --plugin-dir .` 세션(또는 현 세션 `/reload-plugins`)에서:

1. `/ppt-plan` — 가벼운 주제(예: "이 플러그인 repo 소개 5장")로 게이트 3개 통과 → outline.md 확인
2. `/ppt-create` — spec → 렌더 → PNG 검수 → 수정 1회 → lock
3. `/ppt-edit` — 방금 덱의 슬라이드 1장 수정 → 재렌더 확인

Expected: 전 구간이 스크립트 에러 없이 돌고, 수정 루프에서 안 고친 슬라이드 PNG가 변하지 않는다.

- [ ] **Step 2: 스펙 문서 상태 갱신 + Commit**

`docs/superpowers/specs/2026-06-12/ppt-pipeline-design.md`의 `상태:`를 `구현됨(v1 — potx 이식 제외)`으로 수정.

```powershell
git add docs/superpowers/specs/2026-06-12/ppt-pipeline-design.md docs/superpowers/plans/2026-06-12/ppt-pipeline.md
git commit -m "docs(ppt): 파이프라인 스펙·계획 문서"
```

---

## 자기 검토 결과

- **스펙 커버리지**: §2 파이프라인(plan 게이트3·create 루프) → Task 6·7 / §4 산출물·spec.json·theme.json → Task 2·3 / §5 스크립트 → Task 2~5 / §6 폴백(COM 없음·조사 폴백) → Task 5 ps1 exit 2 + ppt-plan 게이트1 / §7 에러 → 커스텀 에러 클래스들 / §8 테스트 → 각 TDD 태스크 / potx(§5 일부·§9-6)는 명시적 후속 계획.
- **타입 일관성**: `validateSpec`/`SpecValidationError`/`LAYOUTS`(Task 2) ↔ render-deck import(Task 4), `loadTheme`/`LAYOUT_NAMES`(Task 3) ↔ render-deck·테스트, `resolveThemeDir`(Task 9) 모두 동일 시그니처 확인.
- **플레이스홀더 없음**: 모든 코드 스텝에 실제 코드, SKILL.md 초안 전문 포함.
