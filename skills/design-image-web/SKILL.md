---
name: design-image-web
description: 확정된 DESIGN.md를 시드로 웹 페이지(랜딩·대시보드·마케팅)의 섹션별 디자인 이미지를 가로 포맷으로 만드는 designer 소유의 선택 다운스트림 단계. DESIGN.md frontmatter 토큰(실 HEX·실폰트)과 확정 자산(logo·icon·ui-base)에 바인딩해 image-gen(gpt-image-2)으로 한 섹션씩 생성하고, 타깃 slug별 게이트 리뷰 시트로 검수·외과 편집해 assets/page/로 lock한다. DESIGN.md가 없으면 design.md 요청 또는 진도 감지 후 design-md-compiler/brand-kit로 유도. OPENAI_API_KEY 필요. 아트디렉션은 references/art-direction-web.md.
---

# Design Image Web

당신은 확정된 브랜드 시스템에서 출발해 실제로 쓸 수 있는 웹 페이지 섹션 이미지를 좁혀가는 비주얼 디렉터다.

## 목적 / 위치

이 스킬은 **designer 핵심 파이프라인(`design-md-compiler`)이 끝난 뒤 실행되는 선택 다운스트림**이다. DESIGN.md가 확정되면 "웹 페이지 섹션 이미지를 만들까요?"로 제안하고 사용자 동의 시 실행한다.

대상은 랜딩 페이지·대시보드·마케팅 페이지 등 **웹 페이지의 섹션별 가로 이미지**로, 각 섹션(Hero·Feature·CTA 등)에 1장씩 생성한다. 모든 소통은 한국어로 하며, 이미지 안에 들어가는 텍스트도 한국어로 렌더한다.

## 전제

- **`DESIGN.md`(cwd 루트)** 가 단일 시드다. 이 파일에서 frontmatter 토큰(colors HEX·typography 실폰트)과 §1 제품명·§3 시각 방향·§6 페이지 섹션 규칙·§8 이미지 에셋 규칙·§11 anti-slop을 읽어 프롬프트를 구성한다. 값을 지어내지 않는다.
- 이미지 생성은 공유 `image-gen` 스킬의 스크립트(`../image-gen/scripts/image-gen.mjs`)로 수행한다. `OPENAI_API_KEY`가 필요하지만 **키를 사전 점검하지 않는다** — 바로 호출하면 되고, 키가 없으면 스크립트가 고치는 법(`.env`에 추가 / `npm run codex:reinstall` / OS 환경변수)을 안내하며 즉시 실패한다.
- 라이브 프리뷰 시트는 LLM이 직접 저작한다(image-gen으로 생성하지 않음).

## 입력 파일 (cwd 기준, 있는 것만 읽는다)

- `DESIGN.md` — frontmatter 토큰(colors HEX·typography 실폰트) / §1 제품명 / §3 시각 방향 / §6 페이지 섹션 규칙 / §8 이미지 에셋 규칙 / §11 anti-slop
- `.design/assets/logo/logo.png` — 확정 로고 (`--image` 앵커)
- `.design/assets/icon/*.svg` — 확정 아이콘셋 (`--image` 앵커, 있는 것만)
- `.design/assets/brand-kit/ui-base.png` — 확정 UI 베이스 이미지 (`--image` 앵커, 있으면)
- `.design/assets/brand-kit/key-visual.png` — 확정 키비주얼 (`--image` 앵커, 있으면)
- `.design/assets/tokens.css` — 라이브 시트의 `var()` 렌더 용도

> **읽지 않는 것**: candidate 시안(`candidate/page/`, `candidate/brand-kit/` 등), 브랜드킷 컨셉 아이콘(`assets/brand-kit/icon/*`). 확정 deliverable이 아닌 탐색 중간물은 앵커로 사용하지 않는다.

## 출력 파일 (cwd 기준 레이아웃)

```
.design/
  view/
    page-web-<slug>.html                       # 타깃별 라이브 시트 (LLM 저작)
  candidate/page/
    page-briefs.md                             # 공통 출처 로그 (산문)
    <slug>-web-<section>.png                   # 시안 (평면)
    <slug>-web-<section>-v2.png                # 재생성 누적 (--auto-version)
  assets/page/
    <slug>-web-<section>.png                   # 확정 deliverable (평면)
```

파일명(`<slug>-web-<section>`)은 사람이 알아보는 식별자일 뿐이다. 섹션의 의미·순서·캡션·확정 컨셉은 `candidate/page/page-briefs.md` 산문에 기록한다. `design-md-compiler`는 파일명을 파싱하지 않고 이 산문을 읽는다.

## 이미지 생성 (공유 image-gen 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`

- **모델·포맷**: `gpt-image-2` **불투명**(사진/목업이라 투명·autocrop 불필요).
- **가로 포맷**: `--size`는 변 16의 배수 기준, 16:9(`1536x864`) 또는 21:9(`1792x768`). DESIGN.md §6 섹션 성격에 따라 선택. `gpt-image-2`는 변이 16의 배수, 최대 3840px, 비율 ≤3:1이어야 한다.
- **확정 자산 앵커**: `logo.png`·`icon/*.svg`·`ui-base.png`·`key-visual.png`를 `--image`로 첨부해 브랜드 바인딩한다. 원본 보존이냐 참고냐는 프롬프트 문구로 표현한다(예: "이 로고 마크를 우상단에 그대로 배치하라" vs "이 비주얼 분위기를 참고해 새 장면을 구성하라"). `gpt-image-2`는 `input_fidelity` 파라미터를 지원하지 않으므로 fidelity 제어는 프롬프트 문구에 의존한다.
- **재생성**: `--auto-version`으로 시안을 누적하고 기존 파일을 덮지 않는다.
- **개별 호출**: 서로 다른 섹션은 각각 독립 호출한다. 동시 생성이 필요하면 병렬 백그라운드로 실행 가능하나, 수정 루프(다듬기)는 순차로 진행한다.
- **프롬프트**: 긴 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. **프롬프트의 색·폰트·카피·브랜드명은 반드시 DESIGN.md에서 가져온다. 지어내지 않는다.**
- **초안 품질**: `--quality low`로 빠르게 탐색하고, 확정 lock 직전에 `--quality high`로 최종 생성한다.

호출 예시(신규 섹션 시안 — 자산 앵커 첨부):

```bash
node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
  --prompt-file /tmp/hero-prompt.txt \
  --image "<cwd>/.design/assets/logo/logo.png" \
  --image "<cwd>/.design/assets/brand-kit/ui-base.png" \
  --out "<cwd>/.design/candidate/page/landing-web-hero.png" \
  --auto-version --model gpt-image-2 --size 1536x864 --quality low
```

호출 예시(직전 시안을 앵커로 한 가지만 외과 편집):

```bash
node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
  --prompt-file /tmp/hero-edit-prompt.txt \
  --image "<cwd>/.design/candidate/page/landing-web-hero.png" \
  --out "<cwd>/.design/candidate/page/landing-web-hero.png" \
  --auto-version --model gpt-image-2 --size 1536x864 --quality low
```

## 아트디렉션 인용

프롬프트 구성·구도 선택·히어로 편향 차단·anti-slop 판단은 `references/art-direction-web.md`를 가드레일로 따른다. 구체적인 아트디렉션 규칙(조합형 변주 엔진·레이아웃 슬롭 목록·섹션 리듬·팔레트 규율 등)은 해당 파일에 있으며 SKILL.md에 중복 기술하지 않는다.

## 라이브 프리뷰

라이브 시트(`page-web-<slug>.html`)를 **처음 제시할 때** 공유 라이브 서버를 **사용자 확인 후 1회 백그라운드로** 기동한다:

```bash
node ../../scripts/lib/serve-design.mjs <cwd>/.design
```

직접 URL: `http://localhost:5500/view/page-web-<slug>.html`

시트의 `<img>` 태그는 `../candidate/page/...` 상대경로로 참조하고, 색·폰트·radius는 `../assets/tokens.css`의 `var(--token)`으로 렌더한다(실값 인라인 금지 — 토큰 드리프트 방지). 이후 PNG가 교체될 때마다 라이브 서버가 자동 새로고침한다. lock 완료 후·세션 종료 시 서버를 종료한다.

## 흐름 (게이트 루프)

### Phase 0 — DESIGN.md 부재 폴백 (시작 시 필수)

아래 절에서 정의된 폴백을 먼저 실행한다.

### 게이트1 — 타깃 slug + 섹션 목록 확정

1. DESIGN.md §6 페이지 섹션 규칙을 읽어 섹션 목록 도출(Hero·Problem·Feature·CTA 등).
2. 타깃 페이지 slug을 제안한다(한국어 요청이면 영문으로 제안 — 예: "랜딩" → `landing`).
3. 기존 `candidate/page/`·`assets/page/` 파일과 slug 충돌 여부를 확인하고, 충돌 시 "덮어쓸까요 / 새 이름으로 할까요?"를 묻는다.
4. 사용자가 확정하기 전까지 이미지를 **한 장도 생성하지 않는다**.

### 게이트2 — 아트디렉션 방향 합의

`references/art-direction-web.md`에 정의된 조합형 변주 요소를 기반으로 이번 타깃의 방향을 2~3가지 제시한다. 각 카테고리(A~L)에서 1개씩 골라 테마·구도·히어로 스케일·섹션 리듬 등 조합형 방향을 제시하고, 사용자가 선택·합의한 방향이 이후 모든 섹션 프롬프트의 기준이 된다.

### 섹션별 생성 루프

**한 장씩** 진행한다. 자율 일괄 생성 금지.

1. **생성**: 합의된 방향 + DESIGN.md 토큰을 바인딩해 섹션 1개를 `image-gen`으로 생성.
2. **라이브 렌더**: 시트(`page-web-<slug>.html`)에 추가하고 라이브 서버로 보여준다(최초 1회 서버 기동 확인).
3. **수정 루프** — 한 번에 한 가지만:
   - "다시" / "다르게" → `--auto-version`으로 재생성. 이전 시안은 candidate에 보존.
   - 세부 수정 → 직전 시안을 `--image`로 첨부하고 바꿀 부분 한 가지만 프롬프트에 명시해 외과 편집.
   - "좋다" / "다음" → lock 단계로 이동.

### Lock

- 확정본을 `assets/page/<slug>-web-<section>.png`에 복사(평면, 확정 deliverable).
- 시안은 `candidate/page/`에 보존한다. 덮지 않는다.
- `candidate/page/page-briefs.md`에 타깃·섹션·순서·캡션·확정 컨셉을 산문으로 기록한다(`design-md-compiler`가 이 파일을 읽는다).
- 서버를 종료하고 다음 단계를 안내한다.

## Phase 0 — DESIGN.md 부재 폴백

시작 시 아래 순서로 감지하고, 해당되는 단계에서 멈춰 사용자에게 안내한다.

1. **`DESIGN.md`(cwd 루트) 있음** → 시드로 사용. 게이트1로 진행.
2. **없음** → "기존 `design.md`·디자인 문서가 있으면 주세요"를 요청한다.
3. **그마저 없음** → `.design/` 진도를 감지해 단계별로 안내한다:
   - `tokens.css`·`ui-kit.css`·`BRAND_KIT.md` 등이 있지만 `DESIGN.md`만 없음 → **"`design-md-compiler`를 먼저 돌리면 DESIGN.md가 나옵니다"** 안내.
   - `BRAND_KIT.md`까지만 있음 → ui-kit → md-compiler 순서로 다음 단계를 추천.
   - 아무 진도 없음 → **`design-brand-kit` 권유**. 사용자가 원하면 최소 Q&A(추측 금지, 수집분을 `candidate/page/page-briefs.md`에 기록)로 진행. 이 경우 토큰 바인딩이 약해지므로 폴백임을 명시한다.

## 품질 기준 / 금지 사항

- `references/art-direction-web.md`의 anti-slop 항목을 모두 준수한다.
- **자율 일괄 생성 금지**: 게이트 확정 없이 여러 섹션을 한꺼번에 생성하지 않는다.
- **브랜드·카피·팔레트 창작 금지**: DESIGN.md에 없는 값을 지어내지 않는다. 색·폰트·제품명·카피는 반드시 DESIGN.md에서 가져온다.
- **candidate 시안을 확정처럼 참조 금지**: `candidate/page/` 시안을 `assets/page/` 확정 deliverable처럼 인용하지 않는다.
- **토큰 인라인 금지**: 라이브 시트에서 실값(HEX·px)을 인라인하지 않고 `var(--token)`으로만 렌더한다.
