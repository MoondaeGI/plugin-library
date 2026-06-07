# 다크모드 로고 변형 (스펙 B-🅱-i) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 확정 라이트 풀로고에서 다크모드 변형을, 영역별 소스색 → 브랜드 다크 hex를 OKLab 지각공간에서 2앵커 엣지 보간으로 치환하는 결정론적 리맵 스크립트로 생성한다.

**Architecture:** 새 스크립트 `remap-logo-dark.mjs`가 기존 `autocrop.mjs`의 PNG 코덱(`decodePNG`/`encodePNG`, node:zlib만)을 재사용한다. 각 불투명 픽셀을 OKLab로 변환해 가장 가까운 두 소스 앵커를 찾고, 그 선분 위 투영 비율 t로 대응 타깃색을 OKLab에서 보간한 뒤 sRGB로 되돌린다(alpha 보존). 색 매핑(소스→타깃 hex)은 CLI 인자로 받는 범용 변환기 — design-logo SKILL이 브랜드 라이트색→다크색 매핑을 구성해 넘기고, 프리뷰 게이트로 검수·승인한다. 구조 재설계가 필요한 소수 로고만 생성 폴백.

**Tech Stack:** Node.js ESM(`remap-logo-dark.mjs`), `node:test`, node:zlib PNG 코덱(기존 재사용), OKLab 색공간 변환(순수 수식), 마크다운 스킬 가이드.

**Spec:** `docs/superpowers/specs/2026-06-07-design-logo-dark-variant-design.md`

---

## Prerequisites

- [ ] 기준선. Run: `npm test` → 전체 PASS(현재 199). Run: `npm run validate` → PASS.
- [ ] 코덱 전제: `skills/image-gen/scripts/autocrop.mjs`가 `decodePNG`(→`{width,height,colorType,bpp,px}`)·`encodePNG(px,w,h,colorType)` export(확인됨). colorType 6=RGBA. gpt-image 투명 출력은 6.
- [ ] OKLab 상수 round-trip은 확인됨(대표 6색 Δ0). 테스트 허용오차는 ±2로 둔다(클램프·반올림 여유).

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `skills/design-logo/scripts/remap-logo-dark.mjs` | OKLab 변환 + 2앵커 엣지 보간 영역 리맵 (lib + CLI) | **신규** |
| `tests/remap-logo-dark.test.mjs` | OKLab round-trip·앵커 판정·보간·alpha 보존·CLI | **신규** |
| `skills/design-logo/SKILL.md` | 흐름 12(다크 변형)·앵커 구성·리맵 호출·생성 폴백·자산 토폴로지·품질기준 | 수정 |
| `skills/references/design/logo-art-direction.md` | 다크 변형 = 결정론 리맵 원칙 + 생성 폴백 단서 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | 다크 로고 `prefers-color-scheme` 스왑 스니펫 | 수정 |

**계약(중요):**
- **lib API**:
  - `srgbToOklab([r,g,b]) → [L,a,b]` / `oklabToSrgb([L,a,b]) → [r,g,b]` (r,g,b 0–255 정수).
  - `hexToRgb(hex) → [r,g,b]`.
  - `remapLogoDark(buf, mappings) → Buffer` — `mappings`는 `[{src:[r,g,b], dst:[r,g,b]}, ...]`. 각 불투명 픽셀을 OKLab 1·2위 앵커 선분에 투영(t)해 타깃색을 OKLab 보간, alpha 보존. 매핑 1개면 그 타깃 단색.
- **CLI**: `node remap-logo-dark.mjs --in <png> --out <png> --map "#SRC:#DST" [--map ...]` (—map 반복).
- **결정 잠금**(스펙 §7 해소): ① 색공간 = OKLab(매칭·보간 둘 다). ② 3색 교차점 = **2앵커 보간 유지**(코너 혼합 픽셀의 미세 오차는 허용 — 평면 로고에서 비중 작음; 필요 시 N앵커는 후속). ③ 소스 앵커 = **명시 매핑**(스크립트는 범용; SKILL이 브랜드 라이트색에서 도출). ④ 다크 팔레트 = 게이트에서 매핑 구성·`candidate/logo/`에 기록(brand-tokens 스키마 불변). ⑤ alpha 임계 `<8`. ⑥ 워드마크/락업 다크 = 비범위(풀로고 1파일). ⑦ 생성 폴백 = 정성 판정(SKILL 문서화).

---

## Task 1: OKLab 변환 헬퍼 (TDD)

**Files:**
- Create: `skills/design-logo/scripts/remap-logo-dark.mjs`
- Test: `tests/remap-logo-dark.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/remap-logo-dark.test.mjs` 생성:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { srgbToOklab, oklabToSrgb, hexToRgb } from "../skills/design-logo/scripts/remap-logo-dark.mjs";

test("OKLab round-trip: sRGB→OKLab→sRGB 가 원본과 ±2 이내", () => {
  for (const c of [[110,74,46],[201,116,59],[237,224,204],[0,0,0],[255,255,255],[221,110,146]]) {
    const rt = oklabToSrgb(srgbToOklab(c));
    for (let i=0;i<3;i++) assert.ok(Math.abs(rt[i]-c[i]) <= 2, `${c} → ${rt} (ch ${i})`);
  }
});

test("hexToRgb: #RRGGBB 파싱", () => {
  assert.deepEqual(hexToRgb("#EDE0CC"), [237,224,204]);
  assert.deepEqual(hexToRgb("6E4A2E"), [110,74,46]);
});

test("OKLab L: 흰색이 검정보다 큼(밝기 단조성)", () => {
  assert.ok(srgbToOklab([255,255,255])[0] > srgbToOklab([0,0,0])[0]);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/remap-logo-dark.test.mjs`
Expected: FAIL — 모듈/함수 없음.

- [ ] **Step 3: 구현 (헬퍼만)**

`skills/design-logo/scripts/remap-logo-dark.mjs` 생성:

```js
#!/usr/bin/env node
// remap-logo-dark.mjs — 라이트 풀로고를 다크 변형으로 결정론 리맵한다(생성 아님).
// 영역별 소스색 → 타깃 hex를 OKLab 지각공간에서 매칭하고, 경계는 가장 가까운 두 앵커
// 사이를 OKLab에서 보간해 매끄럽게 잇는다. alpha 보존. 외부 의존성 없음 —
// image-gen/scripts/autocrop.mjs 의 PNG 코덱(node:zlib)을 재사용한다.
// 범용 변환기: brand-tokens.json을 모른다. 색 매핑은 --map "#SRC:#DST" 로 받는다.
//
// 라이브러리: import { remapLogoDark } from './remap-logo-dark.mjs'
// CLI: node remap-logo-dark.mjs --in <png> --out <png> --map "#6E4A2E:#EDE0CC" --map "#C9743B:#F0B45A"

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('hex 색이 잘못됨: ' + hex);
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function srgbToLinear(c){ c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function linearToSrgb(c){ const v = c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; return Math.max(0, Math.min(255, Math.round(v*255))); }

export function srgbToOklab([R,G,B]) {
  const r=srgbToLinear(R), g=srgbToLinear(G), b=srgbToLinear(B);
  const l=0.4122214708*r+0.5363325363*g+0.0514459929*b;
  const m=0.2119034982*r+0.6806995451*g+0.1073969566*b;
  const s=0.0883024619*r+0.2817188376*g+0.6299787005*b;
  const l_=Math.cbrt(l), m_=Math.cbrt(m), s_=Math.cbrt(s);
  return [
    0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
    1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
    0.0259040371*l_+0.7827717662*m_-0.8086757660*s_,
  ];
}

export function oklabToSrgb([L,A,B]) {
  const l_=L+0.3963377774*A+0.2158037573*B;
  const m_=L-0.1055613458*A-0.0638541728*B;
  const s_=L-0.0894841775*A-1.2914855480*B;
  const l=l_*l_*l_, m=m_*m_*m_, s=s_*s_*s_;
  return [
    linearToSrgb(+4.0767416621*l-3.3077115913*m+0.2309699292*s),
    linearToSrgb(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
    linearToSrgb(-0.0041960863*l-0.7034186147*m+1.7076147010*s),
  ];
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/remap-logo-dark.test.mjs`
Expected: PASS (헬퍼 3 테스트). `remapLogoDark`는 Task 2.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-logo/scripts/remap-logo-dark.mjs tests/remap-logo-dark.test.mjs
git commit -F - <<'EOF'
feat(design-logo): remap-logo-dark OKLab 변환 헬퍼 (스펙 B-🅱-i)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 2: remapLogoDark — 2앵커 OKLab 보간 (TDD)

**Files:**
- Modify: `skills/design-logo/scripts/remap-logo-dark.mjs`
- Test: `tests/remap-logo-dark.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

import 줄을 다음으로 교체:

```js
import { srgbToOklab, oklabToSrgb, hexToRgb, remapLogoDark } from "../skills/design-logo/scripts/remap-logo-dark.mjs";
import { encodePNG, decodePNG } from "../skills/image-gen/scripts/autocrop.mjs";
```

파일 끝에 추가:

```js
// 2x2 RGBA 픽스처: px0=cocoa(불투명), px1=caramel(불투명), px2=투명, px3=흰(불투명)
function fixture() {
  const px = Buffer.from([
    110,74,46,255,   // px0 cocoa #6E4A2E
    201,116,59,255,  // px1 caramel #C9743B
    0,0,0,0,         // px2 투명
    255,255,255,255, // px3 흰
  ]);
  return encodePNG(px, 2, 2, 6);
}
const MAP = [
  { src:[110,74,46], dst:[237,224,204] },  // cocoa → 연크림 #EDE0CC
  { src:[201,116,59], dst:[240,180,90] },  // caramel → 앰버 #F0B45A
];

test("remapLogoDark: 소스색 픽셀이 대응 타깃색으로(±3), alpha 보존", () => {
  const { px } = decodePNG(remapLogoDark(fixture(), MAP));
  for (let i=0;i<3;i++) assert.ok(Math.abs(px[i]-[237,224,204][i])<=3, `px0 ch${i}=${px[i]}`);   // cocoa→크림
  for (let i=0;i<3;i++) assert.ok(Math.abs(px[4+i]-[240,180,90][i])<=3, `px1 ch${i}=${px[4+i]}`); // caramel→앰버
  assert.equal(px[11], 0); // px2 투명 보존
});

test("remapLogoDark: 매핑 1개면 모든 불투명 픽셀이 그 타깃 단색(±3)", () => {
  const { px } = decodePNG(remapLogoDark(fixture(), [{ src:[110,74,46], dst:[10,20,30] }]));
  for (const base of [0,4,12]) for (let i=0;i<3;i++) assert.ok(Math.abs(px[base+i]-[10,20,30][i])<=3);
});

test("remapLogoDark: RGB(투명 없음)·빈 매핑은 에러", () => {
  assert.throws(()=>remapLogoDark(encodePNG(Buffer.from([1,2,3,4,5,6]),2,1,2), MAP), /RGBA/);
  assert.throws(()=>remapLogoDark(fixture(), []), /매핑/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/remap-logo-dark.test.mjs`
Expected: FAIL — `remapLogoDark` 미정의.

- [ ] **Step 3: 구현 추가**

`remap-logo-dark.mjs`의 `oklabToSrgb` 정의 **다음**에 추가:

```js
// 라이트 풀로고를 다크 팔레트로 영역 리맵. mappings: [{src:[r,g,b], dst:[r,g,b]}].
// 각 불투명 픽셀을 OKLab 1·2위 앵커 선분에 투영(t)해 타깃색을 OKLab 보간. alpha 보존.
export function remapLogoDark(buf, mappings) {
  if (!mappings || !mappings.length) throw new Error('매핑이 비었습니다');
  const { width, height, colorType, px } = decodePNG(buf);
  if (colorType !== 6) throw new Error('RGBA(투명) PNG가 필요합니다 (colorType=' + colorType + ')');
  const srcLab = mappings.map(m => srgbToOklab(m.src));
  const dstLab = mappings.map(m => srgbToOklab(m.dst));
  const out = Buffer.from(px);
  for (let p=0; p<width*height; p++) {
    const o = p*4; if (px[o+3] < 8) continue;
    const c = srgbToOklab([px[o], px[o+1], px[o+2]]);
    // OKLab 1·2위 앵커
    let i0=0,d0=Infinity,i1=-1,d1=Infinity;
    for (let k=0;k<srcLab.length;k++){ const s=srcLab[k];
      const dl=c[0]-s[0], da=c[1]-s[1], db=c[2]-s[2]; const d=dl*dl+da*da+db*db;
      if (d<d0){ d1=d0;i1=i0;d0=d;i0=k; } else if (d<d1){ d1=d;i1=k; } }
    let lab;
    if (i1<0 || mappings.length<2) { lab = dstLab[i0]; }
    else {
      const si=srcLab[i0], sj=srcLab[i1];
      const vx=sj[0]-si[0], vy=sj[1]-si[1], vz=sj[2]-si[2];
      const vv = vx*vx+vy*vy+vz*vz || 1;
      const t = Math.max(0, Math.min(1, ((c[0]-si[0])*vx+(c[1]-si[1])*vy+(c[2]-si[2])*vz)/vv));
      const di=dstLab[i0], dj=dstLab[i1];
      lab = [di[0]+(dj[0]-di[0])*t, di[1]+(dj[1]-di[1])*t, di[2]+(dj[2]-di[2])*t];
    }
    const [r,g,b] = oklabToSrgb(lab);
    out[o]=r; out[o+1]=g; out[o+2]=b; // alpha 보존
  }
  return encodePNG(out, width, height, 6);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/remap-logo-dark.test.mjs`
Expected: PASS (헬퍼 3 + remap 3 = 6).

- [ ] **Step 5: 커밋**

```bash
git add skills/design-logo/scripts/remap-logo-dark.mjs tests/remap-logo-dark.test.mjs
git commit -F - <<'EOF'
feat(design-logo): remapLogoDark 2앵커 OKLab 엣지 보간 영역 리맵

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 3: remap-logo-dark CLI

**Files:**
- Modify: `skills/design-logo/scripts/remap-logo-dark.mjs`

- [ ] **Step 1: CLI 블록 추가**

`remap-logo-dark.mjs` **맨 끝**(`remapLogoDark` 다음)에 추가:

```js
// ---- CLI ----
function isMain(){ return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
if (isMain()) {
  const args = process.argv.slice(2); const o = { maps: [] };
  for (let i=0;i<args.length;i++){ const a=args[i]; const n=()=>args[++i];
    if (a==='--in') o.in=n();
    else if (a==='--out') o.out=n();
    else if (a==='--map') o.maps.push(n());
    else if (a==='--help'||a==='-h'){ console.log('node remap-logo-dark.mjs --in <png> --out <png> --map "#SRC:#DST" [--map ...]'); process.exit(0); }
    else { console.error('오류: 알 수 없는 인자 ' + a); process.exit(2); } }
  if (!o.in || !o.out || !o.maps.length) { console.error('오류: --in, --out, 그리고 --map 한 개 이상이 필요합니다'); process.exit(2); }
  if (!existsSync(o.in)) { console.error('오류: 파일 없음: ' + o.in); process.exit(2); }
  try {
    const mappings = o.maps.map(m => { const [s,d]=m.split(':'); if(!s||!d) throw new Error('--map 형식은 "#SRC:#DST": ' + m); return { src: hexToRgb(s), dst: hexToRgb(d) }; });
    mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
    writeFileSync(o.out, remapLogoDark(readFileSync(o.in), mappings));
    console.log(`다크 변형 생성 → ${o.out} (${mappings.length}색 매핑)`);
  } catch (e) { console.error('오류: ' + e.message); process.exit(2); }
}
```

- [ ] **Step 2: CLI 통합 확인**

Run:
```bash
D=$(mktemp -d)
D="$D" node --input-type=module -e "import {encodePNG} from './skills/image-gen/scripts/autocrop.mjs'; import {writeFileSync} from 'node:fs'; const px=Buffer.from([110,74,46,255, 201,116,59,255, 0,0,0,0, 255,255,255,255]); writeFileSync(process.env.D+'/logo.png', encodePNG(px,2,2,6));"
node skills/design-logo/scripts/remap-logo-dark.mjs --in "$D/logo.png" --out "$D/logo-dark.png" --map "#6E4A2E:#EDE0CC" --map "#C9743B:#F0B45A"
D="$D" node --input-type=module -e "import {decodePNG} from './skills/image-gen/scripts/autocrop.mjs'; import {readFileSync} from 'node:fs'; const {px}=decodePNG(readFileSync(process.env.D+'/logo-dark.png')); console.log('px0(코코아→크림) RGB =',px[0],px[1],px[2],'(기대 ~237,224,204)');"
rm -rf "$D"
```
Expected: `다크 변형 생성 → …` + `px0 … ~237,224,204`.

- [ ] **Step 3: 인자 누락·형식오류 exit 2**

Run: `node skills/design-logo/scripts/remap-logo-dark.mjs --in x.png --out y.png; echo "exit=$?"`
Expected: `오류: --in, --out, 그리고 --map 한 개 이상이 필요합니다` + `exit=2`.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-logo/scripts/remap-logo-dark.mjs
git commit -F - <<'EOF'
feat(design-logo): remap-logo-dark CLI (--in/--out/--map 반복)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 4: design-logo 흐름 12(다크 변형) + 스킬 지침

**Files:**
- Modify: `skills/design-logo/SKILL.md`
- Modify: `skills/references/design/logo-art-direction.md`
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`

- [ ] **Step 1: design-logo SKILL 자산 트리에 logo-dark 추가**

`skills/design-logo/SKILL.md` 자산 트리에서 `app-icon.png … bake-logo-assets 생성` 줄 **다음**에 추가(들여쓰기·주석열 맞춤):

```
           logo-dark.png             # 다크모드 변형 (remap-logo-dark 또는 생성 폴백)
```

또한 candidate 트리의 `mark-mono-candidate.png …` 줄 다음에 추가:

```
      logo-dark-candidate.png (+v2…) # 다크 변형 시안(프리뷰 게이트)
```

- [ ] **Step 2: design-logo SKILL 흐름에 12 추가**

`## 흐름`에서 **11. 단색 자산 suite …** 항목 다음에 추가:

```
12. **다크모드 변형(스펙 B-🅱-i)**: 큰 풀로고의 다크모드용 변형을 **결정론 리맵**으로 만든다 — ⓐ 라이트 `logo.png`의 소스색(= 로고에 쓰인 brand-tokens 색)과 각 색의 **다크 타깃**(브랜드 다크 팔레트)을 `#SRC:#DST` 매핑으로 구성한다. ⓑ `node scripts/remap-logo-dark.mjs --in <.design>/assets/logo/logo.png --out <.design>/candidate/logo/logo-dark-candidate.png --map "#SRC:#DST" …`(색마다 --map). OKLab·엣지 보간은 스크립트가 처리. ⓒ **프리뷰 게이트**: **큰 사이즈**로 다크 배경(+ 라이트 원본 나란히)에 렌더하고 **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독·정체성 자가판정 → 부족하면 매핑 조정·재리맵 → 사용자에게 제시(평이한 승인만). ⓓ 승인 → `assets/logo/logo-dark.png` lock, 매핑을 `candidate/logo/logo-briefs.md`에 기록(재현성). **HTML 무편집**. ⓔ **생성 폴백**: 다크에서 구조 재설계(배지 채움 제거·아웃라인 추가 등)가 필요해 리맵으론 룩이 안 살면, `logo.png`를 첨부(`--image --input-fidelity high`)해 "다크 배경용 재설계, 구성·정체성 유지"로 생성한다(색 hex는 부정확함을 감수).
```

- [ ] **Step 3: design-logo SKILL 품질 기준 한 줄**

`## 품질 기준 / 금지 사항`의 `- **단색 자산(스펙 B-🅱-ii)**: …` 줄 다음에 추가:

```
- **다크 변형(스펙 B-🅱-i)**: 큰 풀로고 다크모드는 `remap-logo-dark.mjs`로 라이트 로고에서 결정론 리맵(브랜드 다크 hex·OKLab·엣지 보간)한다 — 정확·재현·무비용. 손편집·임의 생성 금지(라이트가 진실, 다크는 그 함수). 구조 재설계가 필요한 로고만 생성 폴백.
```

- [ ] **Step 4: logo-art-direction에 다크 변형 원칙**

`skills/references/design/logo-art-direction.md` §7 직후 설명 문단(현재 "**단색 마크 축약(스펙 B-🅱-ii)**: …"로 끝남) 끝에 추가:

```
**다크모드 변형(스펙 B-🅱-i)**: 큰 풀로고의 다크 변형은 생성이 아니라 **결정론 팔레트 리맵**으로 만든다 — 라이트 로고의 소스색을 브랜드 다크 팔레트 hex로 영역별 치환(OKLab 매칭, 2앵커 엣지 보간; `remap-logo-dark.mjs`). 정확한 브랜드색·재현성·드리프트 0. 리맵은 *색 교체*라, 다크에서 *구조 변경*(배지 제거·아웃라인화)이 필요한 소수 로고만 어댑트 생성으로 폴백한다.
```

- [ ] **Step 5: brand-kit-html-direction에 다크 로고 스왑 스니펫**

`skills/design-brand-kit/references/brand-kit-html-direction.md` §6 항목에서 **"favicon/app-icon 실파일(스펙 B-🅱-ii)" 하위 불릿 다음**에 추가(두 칸 들여쓰기):

```
  - **다크 로고 스왑(스펙 B-🅱-i)**: 풀로고를 다크 배경(헤더·히어로·푸터·다크모드)에 쓸 땐 `logo.png`↔`logo-dark.png`를 `prefers-color-scheme`로 스왑한다 — `<picture><source srcset="../assets/logo/logo-dark.png" media="(prefers-color-scheme: dark)"><img src="../assets/logo/logo.png" alt="브랜드"></picture>`. `logo-dark.png`가 없으면(design-logo 미실행/리맵 미적용) 스왑 생략하고 `logo.png`만. 작은 마크·favicon의 다크는 이게 아니라 🅱-ii(단색 마스터·favicon-dark)가 담당.
```

- [ ] **Step 6: 검증**

Run:
```bash
node -e "const fs=require('fs');
const c=fs.readFileSync('skills/design-logo/SKILL.md','utf8'); if(!/다크모드 변형\(스펙 B-🅱-i\)/.test(c)||!/logo-dark.png/.test(c)||!/remap-logo-dark/.test(c)) throw new Error('logo SKILL 누락');
const a=fs.readFileSync('skills/references/design/logo-art-direction.md','utf8'); if(!/다크모드 변형\(스펙 B-🅱-i\)/.test(a)) throw new Error('art-dir 누락');
const h=fs.readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); if(!/다크 로고 스왑/.test(h)||!/prefers-color-scheme/.test(h)) throw new Error('html-direction 누락');
console.log('design-logo 다크 변형 OK')"
```
Expected: `design-logo 다크 변형 OK`

- [ ] **Step 7: 커밋**

```bash
git add skills/design-logo/SKILL.md skills/references/design/logo-art-direction.md skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -F - <<'EOF'
feat(design-logo): 다크모드 변형 흐름 12·리맵 호출·스왑 스니펫(스펙 B-🅱-i)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 5: 동기화 · 게이트 · 통합 검증

- [ ] **Step 1: 동기화**

Run: `npm run sync` (Codex 번들·codex-agents 재생성 — gitignore).

- [ ] **Step 2: 게이트**

Run: `npm test` → 전체 PASS(199 + 6 = 205).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 통합 검증 (실제 PNG 리맵·디코드 + 보간 경계)**

```bash
D=$(mktemp -d)
# 32x32: 왼쪽 절반 cocoa, 오른쪽 절반 caramel, 가운데 세로 한 줄은 두 색 평균(경계 모사)
D="$D" node --input-type=module -e "
import { encodePNG } from './skills/image-gen/scripts/autocrop.mjs'; import { writeFileSync } from 'node:fs';
const W=32,H=32; const px=Buffer.alloc(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4;
  let c; if(x===15||x===16) c=[156,95,52]; else if(x<16) c=[110,74,46]; else c=[201,116,59];
  px[o]=c[0];px[o+1]=c[1];px[o+2]=c[2];px[o+3]=255;}
writeFileSync(process.env.D+'/logo.png', encodePNG(px,W,H,6));"
node skills/design-logo/scripts/remap-logo-dark.mjs --in "$D/logo.png" --out "$D/logo-dark.png" --map "#6E4A2E:#EDE0CC" --map "#C9743B:#F0B45A"
D="$D" node --input-type=module -e "
import { decodePNG } from './skills/image-gen/scripts/autocrop.mjs'; import { readFileSync } from 'node:fs';
const {px,width:W}=decodePNG(readFileSync(process.env.D+'/logo-dark.png'));
const at=(x,y)=>{const o=(y*W+x)*4;return [px[o],px[o+1],px[o+2]];};
console.log('좌(코코아→크림) =', at(4,16).join(','), '(기대 ~237,224,204)');
console.log('우(캐러멜→앰버) =', at(28,16).join(','), '(기대 ~240,180,90)');
const m=at(15,16); console.log('경계(평균색) =', m.join(','), '— 두 타깃 사이값이어야(보간)');
"
rm -rf "$D"
```
확인: 좌 ≈ 크림(237,224,204), 우 ≈ 앰버(240,180,90), 경계 픽셀은 둘 사이의 보간값(각 채널이 두 타깃 사이).

- [ ] **Step 4: 최종 코드리뷰 + reload 안내**

전체 diff(`main..HEAD`) 최종 점검(코드 = remap-logo-dark.mjs + 테스트, 나머지 마크다운). 메모리 피드백대로 per-task 리뷰 생략, 코드 태스크(1·2·3)를 본 최종 종합에서 본다.
사용자에게: **"`/reload-plugins` 실행. Codex는 `npm run codex:reinstall`."**

---

## Self-Review (작성자 점검)

- **Spec 커버리지:** §4.1 흐름→Task4(흐름12·게이트·폴백); §4.2 토폴로지→Task4(트리); §4.3 리맵 스크립트(OKLab·2앵커 보간)→Task1·2·3; §4.4 다크 팔레트 입력(게이트 매핑·기록)→Task4 흐름12 ⓐⓓ; §4.5 생성 폴백→Task4 흐름12 ⓔ + 품질기준; §4.6 프리뷰 게이트(큰 사이즈·http)→Task4 흐름12 ⓒ; §4.7 스왑→Task4 Step5; §6 영향 파일→Task1~4; §7 열린질문 1~7→계약 "결정 잠금"에서 해소(OKLab·2앵커·명시매핑·게이트기록·alpha<8·비범위·정성폴백). 누락 없음.
- **Placeholder 스캔:** Task1~3 완전 구현·테스트 코드(OKLab 상수 검증됨). Task4 정확 삽입 문자열·검증 명령. "TBD/적절히" 없음.
- **타입/계약 일관성:** `srgbToOklab`/`oklabToSrgb`/`hexToRgb`/`remapLogoDark(buf, mappings)` 시그니처가 Task1·2(정의)·Task3(CLI 소비)·테스트에서 동일. `mappings=[{src,dst}]` 형태 일치. 자산명 `logo-dark.png`·시안 `logo-dark-candidate.png`가 Task3(출력)·Task4(트리·흐름·스왑)에서 동일. CLI 플래그 `--in/--out/--map`가 Task3·Task4 흐름12·통합검증에서 동일.
- **테스트 카운트:** 199 + 헬퍼 3 + remap 3 = **205**. Task5 게이트와 일치.
