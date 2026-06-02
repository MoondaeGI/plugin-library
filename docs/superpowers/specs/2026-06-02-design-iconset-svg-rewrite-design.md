# design-iconset SVG 재작성 — 설계 문서

- 날짜: 2026-06-02
- 상태: 승인됨 (구현 계획 대기)
- 대상 스킬: `skills/design-iconset/`

## 1. 배경 / 문제

현재 `design-iconset`의 최종 산출물은 `final/iconset/iconset.png` — **시트 이미지 한 장뿐**이다. 이건 "한눈에 보는 검수용 쇼케이스"지 제품 코드에 넣을 수 없다. 게다가 SKILL.md 본문은 *"개별 아이콘 파일이 1급 자산이다"* 라고 선언하면서도, 확정된 풀 세트를 **개별 파일로 저장하는 단계가 흐름에 없다** — 말과 산출물이 어긋나 있다.

또한 현재 iconset은 brand-kit이 만든 `assets/icons/*.png`(래스터)를 **스타일 시드**로 끌어다 쓴다. 그러나 brand-kit 아이콘은 OpenAI Images로 생성된 래스터라 실제 제품 SVG로 쓰기엔 부적합하다.

사용자 결정: 두 스킬의 역할을 **완전히 분리**한다.
- **brand-kit 아이콘** = 브랜드 컨셉/정체성 전시용 (PNG, overview에만). 제품에 안 나감.
- **iconset** = 제품에 실제로 나가는 아이콘을 **SVG로 직접 제작**.

## 2. 목표 / 비목표

### 목표
- iconset이 **제품 코드행 SVG 세트**를 1급 산출물로 생산한다 (`currentColor`로 recolor·무한 scale).
- iconset이 image-gen 파이프라인 의존을 끊고 **LLM이 SVG 코드를 직접 저작**한다 (`OPENAI_API_KEY` 불필요).
- 검수 시트는 그 SVG들에서 **결정적으로 렌더**(HTML 그리드)되어 항상 파일과 일치한다.
- 아이콘 목록·메타포를 **저작 전에 승인**받는 2단 게이트로, 잘못된 형태를 코드로 만들기 전에 거른다.
- §11에서 고른 **아이콘 스타일(line/filled/duotone/glyph/outline+min-fill)에 맞춰** 가족 계약·recolor 규칙·린트가 분기한다.

### 비목표
- brand-kit 아이콘을 SVG로 변환하지 않는다 (컨셉용 PNG로 그대로 둠).
- PNG→SVG 자동 트레이싱을 쓰지 않는다 (stroke 불균일·path 난잡·recolor 불가로 "한 가족" 원칙과 충돌).
- iconset이 brand-kit `assets/icons/*`를 시각 참조로도 읽지 않는다 (스타일 근거는 §11 + tokens만).
- 시트의 PNG 스크린샷을 강제하지 않는다 (검수는 HTML 라이브 프리뷰; PNG는 필요 시 선택).

## 3. 역할 분리

| | brand-kit 아이콘 | iconset (재작성 후) |
|---|---|---|
| 정체 | 브랜드 컨셉/정체성 전시용 PNG | 제품에 실제로 나가는 SVG 세트 |
| 위치 | `assets/icons/*.png` (overview에만) | `.design/icon/*.svg` |
| 생성 | image-gen (래스터, **현행 유지**) | LLM이 SVG 코드 직접 작성 (image-gen·`OPENAI_API_KEY` 불필요) |
| 스타일 근거 | brand-kit 자체 | **§11 규칙 + brand-tokens.json만** (brand-kit PNG 안 봄) |

→ brand-kit은 변경 없음(이미 "풀 아이콘셋은 다운스트림 몫"이라 명시). 공유 ref 팩 `references/design/icon/`도 변경 없음(form·domain 규칙 재사용; image 프롬프트 청크는 brand-kit 컨셉 아이콘이 계속 사용).

## 4. 아키텍처 결정 (Approach A)

아이콘 세트는 image-gen을 타지 않는다. **LLM이 §11 폼 규칙 + tokens를 따라 각 아이콘을 깨끗한 SVG로 직접 작성**한다. 검수 시트는 그 SVG 폴더를 **결정적 스크립트로 HTML 그리드 렌더**한다 — `overview.html`/`build-contact-sheet.mjs`와 같은 "데이터→HTML 렌더" 철학.

근거: ① 제품 코드행 SVG가 직접 나온다, ② 아이콘 이미지 비용 0, ③ 코드라 viewBox·stroke·그리드를 강제해 일관성 완벽, ④ 시트가 항상 파일과 일치, ⑤ 레포의 결정적 렌더 패턴과 일관.

## 5. iconset 새 흐름

### Phase 0 — brand kit 감지
- 감지 대상이 `BRAND_KIT.md §11 + brand-tokens.json`으로 바뀐다 (더 이상 `assets/icons/` 불필요).
- 있으면 → Phase 1.
- 없으면 → 기존처럼 최소 Q&A 폴백(제품명·분야·아이콘 스타일 방향·도메인 메타포·색·상태 필요 여부·목록 초안·피할 클리셰). 수집분을 `iconset-briefs.md`에 기록. 끝에 design-brand-kit 안내.

### Phase 1 — 흡수 → 목록 게이트 → 메타포 게이트 → 가족 계약
1. **md/tokens 흡수 + art direction 백본 고정**: §11(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지패턴 + tokens 색 HEX를 읽어 **SVG 가족 계약**(스타일·viewBox·stroke/fill 규칙·join/cap·코너·라인색·액센트)을 확정. 가족 계약은 art direction 팩의 *증류물*이며, 권위 원본은 `references/design/icon/`의 `icon-rules.md`(§1 원칙·§2 시스템 파라미터·§3 cross-icon 일관성·§4 Avoid·§5 검증 테스트)·`icon-style-catalog.md`(스타일 선택)·`icon-domain-examples.md`(도메인 메타포) + `references/iconset-sheet.md`(재작성본)이다. **단 `icon-rules.md §6`(image-gen 프롬프트 청크)는 SVG 저작에 쓰지 않는다** — 그건 brand-kit 컨셉 아이콘용.
2. **게이트 1 — 목록**: 아이콘 목록을 3분류로 유도해 제시하고 "더 받을 거?"를 묻는다.
   - **① 코어/시스템** (거의 모든 앱 공통; 근거 = §1 사용 맥락): 예 `search`·`settings`·`add`·`edit`·`delete`·`close`·`menu`·`filter`·`sort`·`chevron`·`check`·`more`.
   - **② 도메인/기능** (이 제품에만; 근거 = §1 포지셔닝·§2 에센스·§3 니즈·§4 가치 기둥·§11 모티프 + `icon-domain-examples.md` 해당 도메인): 제품이 하는 일을 동사/명사로 분해해 매핑.
   - **③ 상태** (근거 = §11 상태 규칙): `status-success`·`status-warning`·`status-danger`·`status-info`. 구성 동일, 색만 분기.
   - 규율: **추측 금지**(근거 약하면 임의 추가 말고 *물어서* 넣음), **과다 생성 방지**(기본은 실제 쓸 것만; ~28개 초과 시 기능 그룹 분할 안내).
   - 사용자가 추가/제거/직접지정(영어 kebab-case)으로 편집 → **라벨 목록 확정(잠금)**.
3. **게이트 2 — 메타포**: 확정된 각 라벨에 **concept → metaphor(shape)** 매핑을 표로 제시하고 승인받는다 (저작 전 필수).
   - 표 컬럼: `# | label | concept | metaphor(shape idea) | category`.
   - 여기서 직역(`icon-rules §4 Avoid`)·메타포 언어 불일치(§3 "전부 기하/전부 흐름")를 통째로 검수한다. *단순 라벨 스크립트가 아니라 "왜 이 형태인가"를 먼저 합의*하는 단계.
   - 승인되면 SVG 저작 시작. 사용자가 "직역이다/메타포 안 맞다"고 짚으면 해당 행만 고쳐 재승인.
4. `iconset-briefs.md` 작성(읽은 md 근거 요약·확정 목록·메타포 매핑·가족 계약·색·제약).

### Phase 2 — SVG 저작 → 시트 검수 → 편집 루프 → lock
5. **SVG 저작 (art direction 백본)**: 확정 목록을 가족 계약에 따라 **개별 `.svg` 파일**로 작성(`.design/icon/<name>.svg`). 모든 SVG가 §6 공통 불변 + 스타일별 분기를 따른다. 저작 중 형태·일관성·메타포·회피의 권위는 가족 계약이 아니라 **`icon-rules.md` §1–§5 + `icon-domain-examples.md`**다 — 계약과 충돌하거나 모호하면 원 팩으로 돌아가 해소한다(`icon-rules.md §6` 이미지 청크는 제외).
6. **시트 렌더**: `build-iconset-sheet.mjs`로 `.design/icon/` 폴더의 `*.svg`를 글롭 → 번호+kebab 라벨 HTML 그리드(`.design/icon/iconset-sheet.html`) emit. `serve-design.mjs`로 라이브 프리뷰(이미지 생성·스크린샷 0).
7. **편집 루프**: 사용자가 번호/이름으로 지목하면 **해당 SVG 파일만 외과 편집**(다른 칸 무손상 보장) → 브라우저 자동 새로고침. 목록 자체 변경이면 라벨 추가/삭제 후 재렌더.
8. **일관성 검사**:
   - **구조 린트(결정적)**: 모든 SVG가 같은 `viewBox`, 스타일별 앵커 충족(예 line=stroke-width 균일, duotone=정확히 2톤)인지 검사. 어긋난 파일을 리포트.
   - **시각 자가 검수(프리뷰)**: One-Color Test·Small UI Test(16/20/24px)·cross-icon 메타포/무게 일관성을 라이브 프리뷰에서 눈으로 판정(`icon-rules.md §5`).
9. **lock**: 확정 SVG 세트(`*.svg`)와 `iconset-sheet.html`을 `.design/final/icon/`로 **순수 복사**(brand-kit의 `final/brand-kit/` lock 패턴과 일관). 다운스트림(`design-page-image`·`design-md-compiler`)은 `.design/final/icon/`를 읽는다. 산출 경로 제시 후 안내: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**.

## 6. 가족 계약 (스타일 인지)

§11의 **아이콘 스타일** 필드가 계약 스타일을 결정한다. Illustrative는 기본 세트에서 제외(특수 용도만).

**모든 스타일 공통 불변**: `viewBox="0 0 24 24"` · 공유 키라인/그리드 · 광학 크기 균형 · 코너 반경 통일 · 하나의 메타포 언어 · 차분한 밀도.

| 스타일 | 일관성 앵커 | recolor 규칙 | 구조 린트 |
|---|---|---|---|
| Line/Outline | 균일 stroke-width, join/cap | `stroke="currentColor"` `fill="none"` | 전 SVG stroke-width 동일 |
| Filled | 면 채움·시각 무게 | `fill="currentColor"` | stray stroke 0, 단색 |
| Solid Glyph | 단단한 단색 글리프 | `fill="currentColor"` | 단색, 과밀 없음 |
| Duotone | base+accent 2톤 | `currentColor` + 보조 `fill-opacity:.4` → One-Color Test 통과 | 정확히 2톤 |
| Outline+Min Fill | stroke + 절제된 fill | `stroke="currentColor"` + 액센트 토큰 최소 fill | stroke 균일 + fill 절제 |

- **상태 아이콘**: 어느 스타일이든 구성 동일, success/warning/danger **토큰 색만 분기**(brand-tokens.json).
- Duotone을 골라도 보조 톤을 `currentColor`+opacity로 묶어 **한 색으로 recolor** 가능하게 유지(제품 코드행 요건).

## 7. 산출물 / 파일 레이아웃 (대상 프로젝트 cwd 기준)

```
.design/
  icon/                       # 작업본 (LLM 저작·편집 루프)
    <name>.svg                # 제품 deliverable (currentColor, viewBox 0 0 24 24)
    iconset-sheet.html        # 검수 시트(폴더에서 파생, 항상 일치)
    iconset-briefs.md         # 읽은 md 근거·확정 목록·메타포 매핑·가족 계약·제약
  final/icon/                 # ★ lock — 순수 복사, 다운스트림이 읽음
    <name>.svg
    iconset-sheet.html
```

- **작업본 `.design/icon/` → lock `.design/final/icon/` 순수 복사** (brand-kit의 `.design/final/brand-kit/` lock 패턴과 일관). 다운스트림(`design-page-image`·`design-md-compiler`)은 `.design/final/icon/`를 읽는다.
- **`generated/`는 두지 않는다.** SVG는 텍스트라 래스터처럼 초안 누적(`--auto-version`)이 불필요하고, 작업본 자체의 버전 이력은 git 커밋이 담당한다(작업본 → lock 2단만).
- lock 복사 대상은 `*.svg` + `iconset-sheet.html`. `iconset-briefs.md`는 작업 로그라 작업본(`.design/icon/`)에만 둔다.
- `iconset-sheet.html`의 SVG는 **인라인 임베드**(currentColor/CSS 작동). 캔버스 색·`color`는 brand-tokens.json에서 읽어 recolor를 시연.

## 8. 시트 렌더 스크립트

- 신규: `skills/design-iconset/scripts/build-iconset-sheet.mjs` (스킬 로컬 → Codex 번들에 자동 포함; 최상위 `scripts/`가 아니므로 공유 lib 규칙과 무관).
- 입력: `.design/icon/` 디렉터리 경로(+ 선택적으로 brand-tokens.json 경로).
- 동작: `.design/icon/*.svg`를 글롭(정렬) → 각 파일 인라인 임베드 → 번호(`01`–)+하단 kebab 라벨 그리드 HTML(`.design/icon/iconset-sheet.html`) emit. 헤더(브랜드명 + "ICON SET"). 라이트/다크 캔버스는 brand visual mode. Small UI Test용 16px 미니 행(선택).
- 결정적: 같은 입력 → 같은 출력. 외부 네트워크·이미지 API 호출 없음.

## 9. 변경 범위 (파일별)

- ✏️ `skills/design-iconset/SKILL.md` — 대폭 재작성: 입력(assets/icons 시드 제거, §11+tokens), 출력(svg 폴더 + html 시트), 흐름(2단 게이트 + SVG 저작 + 시트 렌더 + 린트), image-gen 섹션 제거.
- ✏️ `skills/design-iconset/references/iconset-sheet.md` — §4 PNG 시드·§6 image 프롬프트 청크를 **SVG 가족 계약·HTML 그리드 렌더 규칙·스타일별 분기 표**로 교체.
- ➕ `skills/design-iconset/scripts/build-iconset-sheet.mjs` — 신규.
- ➕ `tests/` — `build-iconset-sheet.mjs` 단위 테스트(글롭·정렬·인라인 임베드·라벨/번호·결정성).
- 🔁 `npm run sync` — Codex 번들 재생성(소스 + 생성물 함께 처리).
- 변경 없음: `skills/design-brand-kit/`, 공유 `skills/references/design/icon/` 팩.

## 10. 테스트 전략

- 코드(`build-iconset-sheet.mjs`)는 **TDD**로 작성(레포 규칙). 케이스:
  - 빈 폴더 → 빈 그리드(또는 명확한 안내) 처리.
  - N개 SVG → N칸, 번호 `01`–N 순서·중복/누락 없음.
  - 파일명 → kebab 라벨 매핑 정확.
  - SVG 인라인 임베드(외부 `<img>` 참조 아님)로 currentColor 작동.
  - 같은 입력 → 바이트 동일 출력(결정성).
  - 잘못된/비-SVG 파일 → 명확한 에러(시스템 경계 검증, 외부 입력 불신).
- 스킬 흐름(저작·게이트·린트)은 사람이 협업 루프로 검증(LLM 저작이라 자동 테스트 대상 아님). 구조 린트 자체는 스크립트화하면 테스트 대상에 포함.

## 11. 결정된 기본값

- `viewBox="0 0 24 24"`, 24px artboard·2px 패딩·20px live area(공유 키라인).
- 일반 아이콘 `currentColor`(호출부 recolor); 상태 아이콘은 의미가 색이므로 토큰 색 박음.
- 검수는 HTML 라이브 프리뷰(`serve-design.mjs`); PNG 스크린샷은 선택.
- 시트 상한 ~28개 초과 시 기능 그룹으로 분할 안내.
