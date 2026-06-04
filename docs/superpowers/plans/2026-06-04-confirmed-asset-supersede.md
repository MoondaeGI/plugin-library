# 확정 자산 표시 — 로고 캐노니컬 덮어쓰기 + DESIGN.md 확정-전용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** design-logo가 lock 시 오버뷰 HTML을 편집하지 않고 캐노니컬 로고 파일(`assets/logo/logo.png`)을 덮어써 base 로고를 갈아치우고, DESIGN.md는 락된 확정 제품 자산만 담게 한다.

**Architecture:** 오버뷰 §6은 고정 캐노니컬 경로 `../assets/logo/logo.png`를 가리킨다. brand-kit이 `logo-base.png`에서 그 파일을 시드(미러)하고, design-logo가 그 파일을 덮어쓴다 — 라이브 서버 자동 새로고침으로 반영(HTML 외과 편집 0). 재-lock 클로버는 `candidate/logo/logo-briefs.md`(design-logo 실행 표식) 유무로 막는다. 아이콘셋은 역할 분리(컨셉 PNG vs 제품 SVG) 때문에 마커 슬롯 병존을 유지 — 비대칭은 의도. md-compiler는 확정 자산만 참조.

**Tech Stack:** Markdown 스킬 문서(`skills/*/SKILL.md`, `references/*.md`). 검증은 Grep 일관성 체크 + `npm test`(스크립트 회귀) + `npm run sync`(Codex 번들 재생성). 코드/스크립트 변경 없음.

**근거 spec:** `docs/superpowers/specs/2026-06-04-confirmed-asset-supersede-design.md`

---

## 파일 구조 (편집 대상)

| 파일 | 책임 | 변경 |
|---|---|---|
| `skills/design-logo/SKILL.md` | 로고 확정 단계 | 흐름 10·line 50을 "덮어쓰기·HTML 무수정"으로 (D1) |
| `skills/design-brand-kit/SKILL.md` | 브랜드 킷·오버뷰 저작 | §6 로고 슬롯 폐기·캐노니컬 경로(D2), 출력 트리·흐름 5·8에 `logo/logo.png` 미러+non-clobber |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | 오버뷰 §6 매핑 | line 22: 로고 경로·종횡비 견고성·슬롯 폐기(D2) |
| `skills/design-iconset/SKILL.md` | 아이콘셋 | 역할 분리 단락에 비대칭 의도 한 줄(D3) |
| `skills/design-md-compiler/SKILL.md` | DESIGN.md 컴파일 | 입력 라벨·§8·§12를 확정-전용으로(D4) |

생성물: 스킬 편집 후 `npm run sync`로 Codex 번들 재생성(gitignore된 로컬 산출물 — 커밋 영향 없음). MCP 변경 없음.

---

## Task 1: design-logo — lock을 덮어쓰기로 (HTML 무수정)

**Files:**
- Modify: `skills/design-logo/SKILL.md` (line 50, 흐름 step 10)

- [ ] **Step 1: line 50 — 승급 문구를 덮어쓰기로 교체**

Edit old_string:
```
- 탐색 시트·시안은 `candidate/logo/`에 `--auto-version`으로 누적. 확정 단일 로고만 `assets/logo/logo.png`로 승격하고, **lock 때 `view/overview.html` §6 슬롯에 주입한다**(아래 흐름 10).
```
Edit new_string:
```
- 탐색 시트·시안은 `candidate/logo/`에 `--auto-version`으로 누적. 확정 단일 로고는 `assets/logo/logo.png`에 **덮어쓴다** — `view/overview.html` §6이 이 경로를 직접 가리키므로 HTML 편집 없이 라이브 새로고침으로 반영된다(아래 흐름 10).
```

- [ ] **Step 2: 흐름 step 10 전체 교체**

Edit old_string:
```
10. **확정(승격 + overview 주입)**: 확정본을 `.design/assets/logo/logo.png`로 복사. 시안은 `candidate/logo/`에 보존. 이어 `view/overview.html`의 `<!-- design-logo:slot -->…<!-- /design-logo:slot -->` 사이를 `<img src="../assets/logo/logo.png" alt="확정 로고" style="height:64px">`로 **외과 치환**한다(멱등 — 재실행 안전; 마커가 없으면 §6 Logo Direction 끝에 삽입). 라이브 서버가 떠 있으면 자동 새로고침된다. `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록.
```
Edit new_string:
```
10. **확정(덮어쓰기 — HTML 무수정)**: 확정본을 `.design/assets/logo/logo.png`에 **덮어쓴다**(brand-kit이 시드해 둔 base 복사본을 교체). 시안은 `candidate/logo/`에 보존. `view/overview.html` §6의 로고 자리(심볼·락업 심볼·앱아이콘·파비콘)가 이미 `../assets/logo/logo.png`를 가리키므로 **HTML을 편집하지 않는다** — 라이브 서버가 파일 교체를 감지해 자동 새로고침한다. 시드 `assets/brand-kit/logo-base.png`는 불변이다(작업 시드는 `candidate/logo/seed.png`에 이미 복사됨). `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록한다 — 이 파일은 brand-kit의 non-clobber 표식이자 md-compiler의 출처 표식이다(design-brand-kit 흐름 8·design-md-compiler §12).
```

- [ ] **Step 3: 검증 — design-logo에 슬롯 주입 잔재 없음**

Run (Grep): pattern `design-logo:slot` in `skills/design-logo/SKILL.md`
Expected: **0 matches** (외과 치환·슬롯 주입 문구가 모두 제거됨)

- [ ] **Step 4: 검증 — 덮어쓰기 문구 존재**

Run (Grep): pattern `덮어쓴다` in `skills/design-logo/SKILL.md`
Expected: ≥2 matches (line 50, step 10)

---

## Task 2: design-iconset — 비대칭 의도 한 줄 (D3)

**Files:**
- Modify: `skills/design-iconset/SKILL.md` (역할 분리 단락, line 14)

- [ ] **Step 1: 역할 분리 단락 끝에 비대칭 명시 추가**

Edit old_string:
```
**역할 분리:** brand-kit의 `assets/brand-kit/icon/*.png`는 **브랜드 컨셉/정체성 전시용**(overview에만)이라 제품에 안 나간다. iconset은 그것을 시드로도 읽지 않는다 — 스타일 근거는 **§11 규칙 + tokens만**이며, 제품용 SVG 가족을 처음부터 직접 저작한다.
```
Edit new_string:
```
**역할 분리:** brand-kit의 `assets/brand-kit/icon/*.png`는 **브랜드 컨셉/정체성 전시용**(overview에만)이라 제품에 안 나간다. iconset은 그것을 시드로도 읽지 않는다 — 스타일 근거는 **§11 규칙 + tokens만**이며, 제품용 SVG 가족을 처음부터 직접 저작한다.

> **파이프라인 비대칭(의도):** 로고는 확정 시 캐노니컬 파일(`assets/logo/logo.png`)을 덮어써 overview에서 base를 갈아치우지만, 아이콘은 이 역할 분리 때문에 컨셉 PNG(브랜드 전시)와 확정 SVG(제품)가 overview §11에 **병존**한다. lock 때 `<!-- design-iconset:slot -->` 사이를 확정 SVG로 치환하되 컨셉 PNG는 남긴다(아래 흐름 9). 이 비대칭은 빠뜨린 게 아니라 의도다.
```

- [ ] **Step 2: 검증 — 비대칭 명시 존재**

Run (Grep): pattern `파이프라인 비대칭` in `skills/design-iconset/SKILL.md`
Expected: 1 match

---

## Task 3: design-brand-kit — 오버뷰 §6 로고 슬롯 폐기·캐노니컬 경로 (D2)

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (마커 슬롯 저작 지침 ~line 315–319)

- [ ] **Step 1: 마커 슬롯 저작 지침 블록 교체 (로고 슬롯 제거, 캐노니컬 경로 규약 추가)**

Edit old_string:
```
**다운스트림 누적용 마커 슬롯 (필수):** 저작 시 두 곳에 멱등 외과편집용 HTML 주석 슬롯을 심는다 —
- §6 Logo Direction 안: `<!-- design-logo:slot --><p class="muted">확정 로고 대기 (design-logo)</p><!-- /design-logo:slot -->`
- §11 Imagery/Iconography 안(컨셉 아이콘 다음): `<!-- design-iconset:slot --><p class="muted">확정 아이콘셋 대기 (design-iconset)</p><!-- /design-iconset:slot -->`

design-logo·design-iconset이 lock 때 이 슬롯 사이를 확정 자산으로 치환한다.
```
Edit new_string:
```
**아이콘셋 마커 슬롯 (필수):** §11 Imagery/Iconography 안(컨셉 아이콘 다음)에 멱등 외과편집용 HTML 주석 슬롯을 심는다 — `<!-- design-iconset:slot --><p class="muted">확정 아이콘셋 대기 (design-iconset)</p><!-- /design-iconset:slot -->`. design-iconset이 lock 때 이 슬롯 사이를 확정 SVG 세트로 치환한다(컨셉 PNG는 병존 — 브랜드 컨셉 전시).

**로고는 슬롯이 아니라 캐노니컬 경로로 처리한다 (중요):** §6의 로고 자리(심볼·락업 심볼·앱아이콘·파비콘)는 `<!-- design-logo:slot -->`을 쓰지 않고 **`../assets/logo/logo.png`를 직접 참조**한다. brand-kit이 그 파일을 `logo-base.png`에서 시드(흐름 5·8)하고, design-logo가 lock 때 덮어쓰면 HTML 편집 없이 반영된다. (로고는 갈아치움, 아이콘은 병존 — 이 비대칭은 의도다.) 로고 자리는 `max-height`+`object-fit:contain`으로 저작해 확정 마크 종횡비가 base와 달라도 graceful하게 degrade한다.
```

- [ ] **Step 2: 검증 — design-brand-kit에 로고 슬롯 없음, 아이콘 슬롯 유지**

Run (Grep): pattern `design-logo:slot` in `skills/design-brand-kit/SKILL.md`
Expected: **0 matches**

Run (Grep): pattern `design-iconset:slot` in `skills/design-brand-kit/SKILL.md`
Expected: ≥1 match (유지)

---

## Task 4: design-brand-kit — 출력 트리·흐름 5·8에 `logo/logo.png` 미러 + non-clobber (D1·D2)

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (출력 트리 ~line 71, 흐름 5 ~line 345, 흐름 8 ~line 348)

- [ ] **Step 1: 출력 트리에 캐노니컬 logo/ 추가**

Edit old_string:
```
    brand-kit/  logo-base.png · wordmark-base.png · key-visual.png · ui-base.png · icon/<name>.png
```
Edit new_string:
```
    brand-kit/  logo-base.png(로고 시드) · wordmark-base.png · key-visual.png · ui-base.png · icon/<name>.png
    logo/       logo.png   # 캐노니컬 표시 로고 — brand-kit이 logo-base에서 시드(미러), design-logo가 덮어씀. overview §6이 이 경로를 가리킴(non-clobber: logo-briefs.md 있으면 안 건드림)
```

- [ ] **Step 2: 흐름 5(자산 생산) 끝에 미러 규칙 추가**

Edit old_string:
```
5. **자산 생산 (`assets/brand-kit/`)** — `key-visual`·`logo-base`·`wordmark-base`·`ui-base`·`icon/*` 생성(투명 라우팅·앵커 일관성·품질/비용 규율은 "이미지 생성" 참조). 자산별로 보여주고 → 한 번에 한 가지 증분 편집. §11 아이콘 목록(개수·라벨)은 도메인 근거로 제안·확정(과다 생성 주의). 워드마크 **이미지 모드일 때만** `wordmark-base.png` 생성. 폰트 모드면 스킵하고 §1을 `<span class="wordmark">`로 저작.
```
Edit new_string:
```
5. **자산 생산 (`assets/brand-kit/`)** — `key-visual`·`logo-base`·`wordmark-base`·`ui-base`·`icon/*` 생성(투명 라우팅·앵커 일관성·품질/비용 규율은 "이미지 생성" 참조). 자산별로 보여주고 → 한 번에 한 가지 증분 편집. §11 아이콘 목록(개수·라벨)은 도메인 근거로 제안·확정(과다 생성 주의). 워드마크 **이미지 모드일 때만** `wordmark-base.png` 생성. 폰트 모드면 스킵하고 §1을 `<span class="wordmark">`로 저작.
   - **로고 캐노니컬 미러**: `logo-base.png`를 생성/갱신할 때마다 `assets/logo/logo.png`로 복사한다(§6이 이 경로를 가리킴). 단 `candidate/logo/logo-briefs.md`가 있으면(design-logo가 이미 확정 로고를 만듦) **덮어쓰지 않는다**(non-clobber — 확정 로고 보존).
```

- [ ] **Step 3: 흐름 8(lock) 끝에 캐노니컬 미러 확정 + non-clobber 추가**

Edit old_string:
```
8. **lock (승인)** — 산출물이 이미 캐노니컬 홈에 있다(루트 `BRAND_KIT.md`·`brand-tokens.json` · `view/overview.html` · `assets/brand-kit/`). 별도 복사가 없으므로 lock은 "확정 승인"이다.
```
Edit new_string:
```
8. **lock (승인)** — 산출물이 이미 캐노니컬 홈에 있다(루트 `BRAND_KIT.md`·`brand-tokens.json` · `view/overview.html` · `assets/brand-kit/`). 별도 복사가 없으므로 lock은 "확정 승인"이다.
   - **로고 캐노니컬 미러(non-clobber)**: `candidate/logo/logo-briefs.md`가 **없으면** `assets/logo/logo.png`가 최신 `logo-base.png`의 복사본이 되도록 보장한다(없으면 복사). **있으면** design-logo 확정 로고이므로 건드리지 않는다. 이로써 brand-kit 재실행이 확정 로고를 날리지 않는다.
```

- [ ] **Step 4: 검증 — 캐노니컬 미러·non-clobber 문구 존재**

Run (Grep): pattern `non-clobber` in `skills/design-brand-kit/SKILL.md`
Expected: ≥2 matches (트리·흐름 5 또는 8)

Run (Grep): pattern `assets/logo/logo.png` in `skills/design-brand-kit/SKILL.md`
Expected: ≥3 matches

---

## Task 5: brand-kit-html-direction — §6 매핑 경로·종횡비·슬롯 폐기 (D2)

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md` (line 22)

- [ ] **Step 1: §6 매핑 줄 교체**

Edit old_string:
```
- **§6** `../assets/brand-kit/logo-base.png`(심볼)·`../assets/brand-kit/wordmark-base.png`(락업) + 변형(심볼 단독 · 앱아이콘[브랜드색 라운드 타일, `filter:brightness(0) invert(1)`로 흰 마크] · 파비콘) 고정 크기 + 구성·의미 텍스트. 이 §6 안에 `<!-- design-logo:slot -->…<!-- /design-logo:slot -->` 마커 슬롯을 넣어 design-logo가 확정 로고를 주입할 자리를 만든다. — **폰트 모드면** 락업의 워드마크 부분을 `<span class="wordmark">`로 대체(심볼은 그대로 이미지).
```
Edit new_string:
```
- **§6** `../assets/logo/logo.png`(심볼 — **캐노니컬 로고 경로**; brand-kit이 `logo-base.png`에서 시드, design-logo가 덮어씀)·`../assets/brand-kit/wordmark-base.png`(락업) + 변형(심볼 단독 · 앱아이콘[브랜드색 라운드 타일, `filter:brightness(0) invert(1)`로 흰 마크] · 파비콘) + 구성·의미 텍스트. 로고 자리는 `max-height`+`object-fit:contain`으로 저작해 확정 마크 종횡비가 base와 달라도 graceful하게 degrade한다(고정 height 강제 금지). **`<!-- design-logo:slot -->` 마커는 쓰지 않는다** — design-logo는 이 경로 파일을 덮어쓰는 방식이라 HTML 편집이 없다. — **폰트 모드면** 락업의 워드마크 부분을 `<span class="wordmark">`로 대체(심볼은 그대로 이미지).
```

- [ ] **Step 2: 검증 — §6이 캐노니컬 경로 참조, 슬롯 폐기**

Run (Grep): pattern `design-logo:slot` in `skills/design-brand-kit/references/brand-kit-html-direction.md`
Expected: matches만 있다면 "쓰지 않는다" 맥락 1건뿐 (주입 자리 문구 없음)

Run (Grep): pattern `assets/logo/logo.png` in `skills/design-brand-kit/references/brand-kit-html-direction.md`
Expected: ≥1 match

---

## Task 6: design-md-compiler — 입력 라벨·§8·§12 확정-전용 (D4)

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md` (입력 목록 ~line 25–28, §8 ~line 89, §12 ~line 102)

- [ ] **Step 1: 입력 목록 — 컨셉 PNG 재라벨, 로고 단일 경로, 시안 폴백 제거**

Edit old_string:
```
- `.design/assets/brand-kit/*.png`, `.design/assets/brand-kit/icon/*.png` (확정 base 자산)
- `.design/assets/logo/*.png`, `.design/assets/icon/*.svg`, `.design/assets/page/*.{png,jpg,jpeg,webp}` (확정 deliverable)
- `.design/candidate/page/*.{png,jpg,jpeg,webp}` (확정 전 시안 폴백)
```
Edit new_string:
```
- `.design/assets/brand-kit/*.png` (확정 base 자산 — `logo-base`·`key-visual`·`ui-base`·`wordmark-base`)
- `.design/assets/brand-kit/icon/*.png` (**컨셉 전용 — DESIGN.md 제품 아이코노그래피로 쓰지 않음**; 브랜드 정체성 전시물)
- `.design/assets/logo/logo.png` (확정 로고 — brand-kit lock 후 **항상 존재**: design-logo 덮어쓰기 또는 base 시드)
- `.design/assets/icon/*.svg`, `.design/assets/page/*.{png,jpg,jpeg,webp}` (확정 deliverable)
- `.design/candidate/logo/logo-briefs.md` (선택 — 있으면 전용 로고 탐색됨; §12 출처 표식)
```

- [ ] **Step 2: §8 이미지 에셋 사용 규칙 — 확정-전용 원칙**

Edit old_string:
```
## 8. 이미지 에셋 사용 규칙
- 로고: / 배경: / 제품 목업: / UI 킷 레퍼런스: / 사용하지 말아야 할 방식:
```
Edit new_string:
```
## 8. 이미지 에셋 사용 규칙
DESIGN.md는 **락된 확정 제품 자산만** 참조한다(candidate 시안·컨셉 전시물 제외).
- 로고: `assets/logo/logo.png`(brand-kit lock 후 항상 존재 — design-logo 덮어쓰기 또는 base 시드) / 배경: / 제품 목업: / 아이콘셋: `assets/icon/*.svg`(없으면 §12 Gap; 컨셉 아이콘 `brand-kit/icon/*`는 제품 아이코노그래피로 쓰지 않음) / UI 킷 레퍼런스: / 사용하지 말아야 할 방식: candidate 시안을 확정처럼 참조하는 것.
```

- [ ] **Step 3: §12 Provenance — 출처 표식 규칙 추가**

Edit old_string:
```
## 12. Provenance & Known Gaps
- 읽은 입력 파일 목록 / 추측한 값(표시) / 누락 입력(어떤 이전 단계가 필요한지) / 근거 부족 항목 / frontmatter는 tokens.css에서 재생성됨을 명시.
```
Edit new_string:
```
## 12. Provenance & Known Gaps
- 읽은 입력 파일 목록 / 추측한 값(표시) / 누락 입력(어떤 이전 단계가 필요한지) / 근거 부족 항목 / frontmatter는 tokens.css에서 재생성됨을 명시.
- **확정 자산 출처**: `candidate/logo/logo-briefs.md`가 없으면 "전용 로고 미탐색 — brand-kit base 마크 사용(design-logo 권장)"을 적는다. 확정 아이콘셋(`assets/icon/*.svg`)이 없으면 "아이콘셋 미확정 — design-iconset 필요"를 적는다.
```

- [ ] **Step 4: 검증 — 확정-전용 라벨 적용, 시안 폴백 제거**

Run (Grep): pattern `확정 전 시안 폴백` in `skills/design-md-compiler/SKILL.md`
Expected: **0 matches**

Run (Grep): pattern `제품 아이코노그래피로 쓰지 않음` in `skills/design-md-compiler/SKILL.md`
Expected: 1 match

---

## Task 7: 전역 일관성 검증 + sync + 커밋

**Files:** (전체 — 읽기 전용 검증 후 커밋)

- [ ] **Step 1: 전역 grep — 로고 슬롯 잔재가 spec/plan 외에 없는지**

Run (Grep): pattern `design-logo:slot` in `skills/`
Expected: `brand-kit-html-direction.md`의 "쓰지 않는다" 맥락 1건만 (주입 자리·대기 플레이스홀더 문구 0건). design-logo·design-brand-kit SKILL엔 0건.

- [ ] **Step 2: 스크립트 회귀 테스트 (명령 — 실행 전 사용자 확인)**

Run: `npm test`
Expected: 전부 PASS (스킬 문서만 바꿨으니 스크립트 테스트 무영향 — 회귀 없음 확인용)

- [ ] **Step 3: Codex 번들 재생성 (명령 — 실행 전 사용자 확인)**

Run: `npm run sync`
Expected: 성공. `plugins/personal/`(gitignore된 로컬 번들)이 새 스킬 문서로 갱신됨. 커밋되는 MCP 생성물은 변화 없음(MCP 무변경).

- [ ] **Step 4: 커밋 (명령 — 실행 전 사용자 확인; 메시지·범위 승인)**

이 변경은 상호 의존적인 문서 일관성 변경이라 **단일 원자 커밋**으로 묶는다(반쯤 적용되면 스킬 문서가 모순됨 — frequent-commit 가이드는 이 경우 적용 안 함).

```bash
git add skills/design-logo/SKILL.md skills/design-iconset/SKILL.md \
  skills/design-brand-kit/SKILL.md \
  skills/design-brand-kit/references/brand-kit-html-direction.md \
  skills/design-md-compiler/SKILL.md \
  docs/superpowers/specs/2026-06-04-confirmed-asset-supersede-design.md \
  docs/superpowers/plans/2026-06-04-confirmed-asset-supersede.md
git commit -m "$(cat <<'EOF'
feat(design): 확정 로고는 캐노니컬 파일 덮어쓰기로 base 갈아치움 + DESIGN.md 확정-전용

design-logo lock이 overview HTML을 편집하지 않고 assets/logo/logo.png를
덮어써 §6 base 로고를 갈아치운다(오버뷰는 이 경로를 직접 참조, 라이브
새로고침으로 반영). brand-kit이 logo-base에서 그 파일을 시드(미러)하되
candidate/logo/logo-briefs.md 표식으로 non-clobber. 아이콘셋은 역할 분리로
컨셉 PNG+확정 SVG 병존 유지(의도된 비대칭). design-md-compiler는 락된 확정
제품 자산만 참조(컨셉 PNG·candidate 시안 제외).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review (작성자 체크)

**Spec coverage:**
- D1(캐노니컬 덮어쓰기·non-clobber) → Task 1(design-logo lock), Task 4(brand-kit 시드·non-clobber) ✓
- D2(§6 슬롯 폐기·캐노니컬 경로·종횡비) → Task 3(SKILL 지침), Task 5(html-direction 매핑) ✓
- D3(아이콘 무변경·비대칭 명시) → Task 2(design-iconset), Task 3에도 한 줄 ✓
- D4(md-compiler 확정-전용·출처 표식) → Task 6 ✓
- degrade(로고 항상 존재·아이콘 §12 Gap) → Task 6 Step 2·3 ✓
- 생성물 동기화(npm run sync) → Task 7 ✓

**Placeholder scan:** 모든 Edit에 정확한 old/new 텍스트. "적절히 처리" 류 없음 ✓

**Type/이름 일관성:** 캐노니컬 경로 `assets/logo/logo.png`, 시드 `assets/brand-kit/logo-base.png`, 표식 `candidate/logo/logo-briefs.md` — 전 Task 동일 표기 ✓

**주의(실행자):** Edit old_string는 현재 파일과 **바이트 단위 일치**해야 한다. 적용 전 해당 줄을 Read로 확인하고, 줄바꿈·공백이 다르면 실제 내용에 맞춰 old_string을 보정하라(의미는 new_string 유지). grep 검증 결과가 Expected와 다르면 멈추고 원인 파악.
