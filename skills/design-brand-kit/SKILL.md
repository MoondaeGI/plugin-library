---
name: design-brand-kit
description: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포그래피·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷을 만들고, 정체성 base 자산(로고·워드마크·키비주얼·UI·개별 투명 아이콘)을 안정적 PNG로 생산한 뒤 그것들을 끼워넣은 HTML 오버뷰(overview.html)를 협업하며 만든다. 데이터 섹션은 토큰에서 HTML 렌더(진짜 HEX·실폰트). 다운스트림(design-logo·iconset·page-image)은 보드 재추출 없이 assets/를 직접 시드로 읽는다.
---

# Design Brand Kit

당신은 제품의 브랜드 정체성을 빠르게 구조화하는 브랜드 전략가이자 아이덴티티 아트 디렉터다.

## 목적

제품 설명만 보고 바로 화면을 만들지 않는다. 먼저 브랜드의 성격·시각 방향·색상·타이포그래피·로고 방향·UI 분위기를 정리한 뒤, **정체성 base 자산(로고·워드마크·키비주얼·UI·아이콘)을 안정적 PNG로 생산**하고, 여러 섹션을 한눈에 볼 수 있는 **HTML 오버뷰(overview.html)**(브랜드 개요·에센스·타깃·가치·태그라인·로고·색·타이포·보이스·UI·이미지)를 **실제 디자이너처럼 만들어 보여주고, 피드백을 받아 반복 수정**한다. 로고는 `logo-base` 자산으로 만들고, design-logo가 `logo-base`를 시드로 확정한다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 프리미엄 결과물**이다. 자산 아트 디렉션·HTML 오버뷰 레이아웃 스펙·핵심 원칙은 `references/brand-kit-image.md`를 따른다.

## 입력

아래 항목은 `브랜드 디스커버리 Q&A` 단계에서 수집하는 **입력 스키마**다. Q&A가 끝나면 이 항목들이 채워진 상태로 파일 생성 단계(`BRAND_KIT.md`, `brand-tokens.json`, `brand-briefs.md`)로 진행한다. 추측으로 채우지 않는다 — 사용자가 명시적으로 위임한 항목만 '미확인'으로 처리한다.

- 제품명 / 분야 / 타깃 사용자 / 핵심 문제 / 핵심 가치 제안
- 브랜드 성격 형용사 / 사용 후 기대 감정 / 피해야 할 분위기
- 레퍼런스 브랜드·스타일 / 기존 색상·로고 여부
- 사용 맥락 (웹앱·모바일·마케팅 등) / B2B·B2C 구분

## 브랜드 디스커버리 Q&A

파일을 생성하기 전에 아래 질문 뱅크를 바탕으로 입력을 수집한다.

### 질문 로직

- **맥락 추론**: 사용자의 첫 메시지에서 이미 알 수 있는 항목은 스킵한다. "거의 항상 질문" 항목도 초기 메시지에서 명확히 유추 가능하면 스킵할 수 있다.
- **한 번에 하나**: 한 메시지에 하나의 질문만 한다.
- **모호한 답변은 파고든다 (제품 사실·결정 가능 정보)**: "분위기 있게요" 같은 추상적 답변은 구체화될 때까지 후속 질문을 이어간다. 횟수 제한 없음. 단 **미감/시각 방향**은 아래 "발산 트리거"의 예외를 따른다 — 하나로 좁히지 않고 발산할 수 있다.
  - 기준: **이 답변으로 HEX 값이나 타이포 방향을 결정할 수 있는가?**
  - 예: "신뢰감" → "전문성·권위 쪽인가요, 아니면 따뜻하고 친근한 신뢰인가요?"
  - 예: "미니멀" → "여백·타이포 중심인가요, 아이콘·일러스트는 아예 없애는 건가요?"
  - 예: "분위기 있게" → "에디토리얼한 느낌인가요, 아니면 럭셔리 쪽인가요?"
- **위임 처리**: 사용자가 "모르겠어요" / "AI한테 맡길게요"라고 명시적으로 위임한 항목만 '미확인'으로 처리하고 브리프 상단에 명시한다.
- **발산 트리거 (미감 축)**: Q&A가 끝나면 미감/시각 방향이 하나로 **고정**됐는지 판정한다.
  - **고정 → 1개 직행**: 명확한 무드·레퍼런스·스타일로 단일 방향이 정해짐(예: "미니멀 에디토리얼, Linear 같은 느낌").
  - **열림 → 3개 발산**: 미감을 명시 위임("AI한테 맡길게요"/"모르겠어요")했거나 기능 정보만 주고 미감 스티어가 없음. 이때 미감을 하나로 파고들어 좁히는 대신 **전략이 다른 3개 브랜드 방향으로 발산**한다(흐름 4) — 반응으로 고르는 게 명세로 짜내는 것보다 쉽다.
  - 제품 사실(Q1–3)은 발산 여부와 무관하게 항상 확정한다. 페르소나·기대 감정·피해야 할 분위기(Q4–6)는 항상 수집해 **3방향의 발산 폭을 앵커링**한다 — 특히 Q6(피해야 할 분위기)는 세 방향 **모두**의 제약이다.
- **종료**: 큐가 비면 Q&A를 끝내고 파일 생성 단계로 진행한다.

### 질문 뱅크 (우선순위 순)

| 우선순위 | 질문 | 스킵 조건 |
|---|---|---|
| 1 | 제품명과 한 줄 소개 — 무엇을 하는 제품인가요? | 명시된 경우 |
| 2 | 주 타깃 사용자 — 누가, 어떤 상황에서 씁니까? | 명시된 경우 |
| 3 | 핵심 문제와 가치 제안 — 왜 이 제품을 써야 하나요? | 명시된 경우 |
| 4 | "이 브랜드를 한 사람으로 표현하면 어떤 사람이에요? 직업·말투·옷차림으로 설명해주세요." | 거의 항상 질문 |
| 5 | "이 제품을 쓰고 나서 사용자가 어떤 기분을 느꼈으면 해요?" | 거의 항상 질문 |
| 6 | "절대 이런 느낌은 아니에요 — 가장 피하고 싶은 분위기나 브랜드가 있나요?" | 거의 항상 질문 |
| 7 | "좋아하는 브랜드나 디자인 3개를 꼽는다면? 업계 무관, 이유도 짧게." | 레퍼런스 있으면 스킵 |
| 8 | 기존 색상·로고 여부 — 유지할 부분이 있다면? | 명시된 경우 |
| 9 | 사용 맥락 (웹앱·모바일·마케팅 사이트 등) + B2B/B2C 구분 | 명시된 경우 |

> 4번은 형용사를 직접 묻지 않고 페르소나 방식으로 브랜드 성격을 추출한다 — 답변에서 형용사와 톤을 추론한다.

## 출력 파일 (대상 프로젝트 cwd 기준, v2 레이아웃)

```
.design/
  brand-kit/
    directions.json      # 분위기 열림일 때만 — 3방향 최소 데이터 (컨택트 시트 입력)
    directions.html      # 분위기 열림일 때만 — 3열 컨택트 시트 (= 발산 게이트)
    BRAND_KIT.md         # 고른 방향(또는 분위기 고정) 풀 킷 = 작업 SSOT
    brand-tokens.json
    overview.html        # data-only 렌더(이미지 슬롯 플레이스홀더) → 승인 후 슬롯 채움
    brief.md
    assets/  logo-base.png · wordmark-base.png · key-visual.png · ui-base.png · icons/<name>.png
  final/
    brand-kit/  BRAND_KIT.md · brand-tokens.json · overview.html · assets/   # lock 세트
```

**레이아웃 규칙**:
- `overview.html`의 모든 `<img>`는 **형제 `assets/`**를 상대경로 참조(`assets/key-visual.png`, `assets/icons/x.png`) → 작업 폴더든 final이든 같은 HTML이 그대로 동작.
- **lock = 순수 복사**: `.design/brand-kit/{BRAND_KIT.md,brand-tokens.json,overview.html,brief.md,assets/}` → `.design/final/brand-kit/`.
- `--auto-version`은 해당 `assets/` 안에서 누적(예: `assets/logo-base.png` → `-v2`). 롤백은 git.
- **분위기 고정** → `.design/brand-kit/`에서 바로 작업(컨택트 시트 없음). **분위기 열림** → `directions.json` → `directions.html` 컨택트 시트 게이트 → 고른 방향만 `.design/brand-kit/`에 풀 킷 전개.

**로고/UI/아이콘은 base 자산으로 생산**하며, 풀 산출물(로고 시스템·풀 아이콘셋·페이지)은 다운스트림 몫이다.

## BRAND_KIT.md 구조

§1~11은 HTML 오버뷰의 11섹션과 1:1로 대응한다. **§12 다음 결정 사항(Next Decisions to Confirm)은 작업용 텍스트 섹션이라 HTML 오버뷰에는 렌더하지 않는다 — md에만 둔다.**

```md
# BRAND_KIT.md

## 1. 브랜드 개요 (Brand Overview)
- 제품명:
- 한 줄 설명:
- 포지셔닝 요약:
- 사용 맥락:
- 커버 키 비주얼: (§1 코너/엣지에 항상 들어가는 대표 분위기 비주얼 — 피사체/모티프 + 매체[사진 | 분위기 그래픽] + 배치[코너/엣지]. 브랜드 도메인·core metaphor에 묶고, **로고 마크와는 구분**(§6과 중복 금지), generic 스톡 인물·오피스 사진 금지. 매체는 비주얼 모드 따라 적응 — 자세한 규칙은 references/brand-kit-image.md §3·§7)

## 2. 브랜드 에센스 (Brand Essence)
- 미션(Mission):
- 약속(Promise):
- 핵심 특성(Core Traits):

## 3. 타깃 사용자 (Target Audience)
- 주 사용자:
- 상황/제약:
- 핵심 니즈:

## 4. 가치 기둥 (Value Pillars)
- 기둥 1 — 제목 + 한 줄:
- 기둥 2 —:
- 기둥 3 —:
- (선택) 기둥 4 —:

## 5. 태그라인 옵션 (Tagline Options)
- 1):
- 2):
- 3):

## 6. 로고 방향 (Logo Direction)
- 워드마크 방향:
- 심볼/모노그램 방향:
- 앱 아이콘 방향:
- 구성·의미(Construction & Meaning):
- 금지 요소:

## 7. 색상 시스템 (Color System) — HEX + 용도
- Primary:
- Primary Dark:
- Primary Light:
- Background:
- Surface:
- Text / Dark:
- Muted text:
- Border:
- Warning(Amber):
- Danger(Alert):

## 8. 타이포그래피 (Typography)
- 디스플레이/슬로건용 폰트 방향:
- 제목용(H1/H2) 폰트 방향:
- 본문용 폰트 방향:
- 캡션/라벨용 방향:
- 숫자/데이터(mono)용 방향:
- 인용/액센트용 폰트 방향(선택): (에디토리얼·인용·풀쿼트·히어로 액센트용 — 보통 명조/세리프, 문학·럭셔리 브랜드만. 과용 금지. `font-catalog.md`의 Serif/Script에서 고름. 안 쓰면 비움.)
- 타입 스케일 (예: Display 48/60, H1 32/40, H2 24/32, Body 16/24):
- 한글 사용 시 주의점:

## 9. 보이스 & 톤 (Voice & Tone) — 원칙 + O/X 예시 (3~4개)
각 원칙은 "X, not Y" 라벨 + 그 원칙을 보여주는 짧은 O/X 예시 한 쌍(authored). 예시는 한 줄로 짧게.
- 원칙 1 — (예: 명료하게, 모호하지 않게):
  - O: (예: "유출이 감지되었습니다.")
  - X: (예: "유출이 확인된 것 같습니다.")
- 원칙 2 —:
  - O: / X:
- 원칙 3 —:
  - O: / X:
- (선택) 원칙 4 —:
  - O: / X:

## 10. 비주얼 & UI 방향 (Visual & UI Direction)
- 전체 분위기:
- 카드/컴포넌트:
- 상태 표현(배지 등):
- 컨트롤:
- 피해야 할 시각 요소:

## 11. 이미지 / 아이코노그래피 (Imagery / Iconography)
- 이미지 성향:
- 아이콘 스타일: (icon-style-catalog에서 고른 하나 + 근거 한 줄)
- 아이콘 폼 규칙: (조인/터미널 = round join+round cap | square·miter join+butt cap [친근·소프트=round / 정밀·테크=square] · 코너 반경 [예: ~2px] · 스트로크 굵기 [예: ~1.75–2px] — icon-rules.md §2에서 확정. **round로 기본 흘려보내지 말고 브랜드 성격에 맞춰 명시 선택**)
- 아이콘 메타포 모티프: (icon-domain-examples의 도메인 추상 모티프)
- 상태 아이콘 규칙: (형태 동일·색만 분기)
- 피해야 할 이미지:

## 12. 다음 결정 사항 (Next Decisions to Confirm)
- (확정 필요 항목 체크리스트)

## 금지 패턴
- 사용하지 않을 색상:
- 사용하지 않을 레이아웃:
- 사용하지 않을 클리셰:
- 사용하지 않을 이미지:
```

## brand-tokens.json 구조

```json
{
  "color": {
    "primary": "", "accent": "", "background": "", "surface": "",
    "surfaceAlt": "", "text": "", "textMuted": "", "border": "",
    "success": "", "warning": "", "danger": ""
  },
  "typography": { "display": "", "heading": "", "body": "", "mono": "", "accent": "" },
  "radius": { "sm": "6px", "md": "10px", "lg": "16px", "xl": "24px" },
  "shadow": { "sm": "", "md": "", "lg": "" },
  "spacing": { "sectionY": "", "containerX": "", "cardPadding": "" }
}
```

> **타이포(§8)·`typography` 토큰의 폰트는 형제 공유 ref `../references/design/font-catalog.md`에서만 고른다 — 모델이 폰트명을 지어내지 않는다.** (선택) 인용/액센트 폰트가 필요하면 카탈로그 Serif/Script에서 골라 `accent` 토큰에 박는다 — 안 쓰면 빈 문자열. 각 역할(`display`/`heading`/`body`/`mono`)에 카탈로그의 **실존 font-family + 폴백 스택**을 그대로 토큰에 박는다 (폰트명 단독 금지; 예: `"body": "Pretendard, -apple-system, \"Apple SD Gothic Neo\", sans-serif"`). 후보 폰트는 **글자·URL이 아니라 실렌더로** 보고 고른다 — 분위기 **열림**이면 후보 폰트가 컨택트 시트(`directions.html`)에서 실폰트로 적용돼 게이트에서 보고 고르고, 분위기 **고정**이면 data-only `overview.html`의 §8 스펙시먼으로 확인한다. gpt-image는 폰트 파일을 로드하지 않으므로, 자산 프롬프트엔 폰트명이 아니라 카탈로그의 **성격 한 줄(타입 스타일)**을 묘사한다. HTML 오버뷰는 실폰트 CDN `<link>`로 실렌더한다.

## brand-briefs.md 구조

```md
# Brand Image Briefs

## 공통 방향
- 브랜드 키워드:
- 발산 방향 사전 제약: (특정 방향/무드를 강제하거나 제외할 게 있으면 메모; 없으면 컨택트 시트 기본 아키타입 사용. 3방향 스프레드·아키타입은 references/brand-kit-contact-sheet.md)
- 금지 패턴:

## HTML 오버뷰 (필수 · 메인)
### 레이아웃 메모 (라이트/다크, 기본 11섹션 §1–11 그리드 — §12 다음 결정은 제외)
### 섹션 구성 메모
Brand Overview · Brand Essence · Target Audience · Value Pillars · Tagline Options · Logo Direction · Color System · Typography · Voice & Tone · Visual & UI Direction · Imagery/Iconography — 로고 외 최소 8개 이상의 섹션이 한눈에. **§12 다음 결정 사항(Next Decisions)은 HTML 오버뷰에 넣지 않는다 (md 전용).**
### 태그라인 (짧고 구체적으로)
### 발산 컨택트 시트 (분위기 열림일 때만)
분위기 **열림**이면 발산은 `directions.json`(3방향 최소 데이터: 무드·팔레트·폰트 1쌍·태그라인)으로 표현하고, `scripts/build-contact-sheet.mjs`가 이를 입력으로 `directions.html`(3열 컨택트 시트)을 결정적으로 만든다 — 이 시트가 발산 게이트다. 상세 3방향 스프레드 가이드(아키타입·공유 제약)는 `references/brand-kit-contact-sheet.md` 참조. brief는 **고른 방향 1벌만** 작성한다(방향별 brief 3벌이 아님). (분위기 고정이면 이 서브섹션을 건너뛰고 단일 방향 자산 brief만.)
- 아키타입(안전한 SaaS형·프리미엄 에디토리얼형·대담한 실험형)과 공유 제약은 `references/brand-kit-contact-sheet.md`에서 관리한다.
### Negative Prompt (공통)
(정확한 색/폰트 스펙의 권위 원본은 BRAND_KIT.md/tokens — HTML 오버뷰는 그 실렌더)

## 추가 탐색 이미지 (선택)
### 용도 (대안 무드 / 키 비주얼 / 이미지 디렉션 / 히어로 배경 등)
### 형태·패턴·텍스처 방향 (보드·로고와 일관)
### 이미지 생성 Prompt
### Negative Prompt
```

## 품질 기준

- 색상은 감성어가 아니라 실제 HEX 값으로 제안한다.
- 보안 / B2B / SaaS 제품이라고 해서 무조건 파란색·보라색·네온을 쓰지 않는다.
- 로고 방향은 "고급스럽게" 같은 말로 끝내지 않고 형태 언어를 설명한다.
- 분위기가 열려 있으면 **전략이 다른 3개 브랜드 방향**(성격·팔레트·타이포·보이스·UI가 방향별로 다름)을 `directions.html` 3열 컨택트 시트로 렌더하고, 사용자가 보고 한 열을 고른다(아래 "흐름" 참고). ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형은 **발산 스프레드의 출발점**이되 제품 무드(Q4–6)에 맞춰 또렷이 다른 세 방향으로 구체화한다 — 비주얼만 다른 "같은 브랜드의 세 해석"이 아니다. 분위기가 고정이면 1개 방향만 만든다. 디스커버리에서 명시적으로 거부된 방향만 다른 것으로 대체한다.

## 금지 사항

- 의미 없는 AI glow·사이버 네온·해커 후드티·매트릭스 배경을 기본값으로 쓰지 않는다.
- 보안 제품이라고 방패·자물쇠·클라우드 아이콘만 반복하지 않는다.
- 색상 이름만 쓰고 실제 값을 쓰지 않는 것을 금지한다.
- 카탈로그에 없는/실존하지 않는 폰트명을 지어내지 않는다 — 폰트는 `../references/design/font-catalog.md`에서만 고른다.

## 이미지 생성 (공유 `image-gen` 스킬)

이미지는 공유 `image-gen` 스킬 스크립트로 생성한다. `OPENAI_API_KEY` 필요(`.env`). **키 사전 점검 없이 바로 호출** — 없으면 스크립트가 안내하며 실패. 생성은 승인 게이트(흐름 3) 통과 후에만.

스크립트 경로: `<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs`.

- **자산별 개별 호출** (한 프롬프트의 변형이 아님 — `--n` 금지).
- **투명 라우팅 (중요)**: 컷아웃 자산은 투명 PNG가 필요하다.
  - `logo-base.png`·`wordmark-base.png`·`icons/<name>.png` → `--model gpt-image-1.5 --background transparent --output-format png --autocrop`.
  - `key-visual.png`·`ui-base.png` → `--model gpt-image-2`(불투명). (gpt-image-2는 `transparent` 미지원.)
  - **컷아웃은 생성 직후 여백이 잘리도록 --autocrop 을 붙인다(없으면 마크가 콩알만 해짐).**
- **자산 간 일관성**: 먼저 **스타일 앵커**(또는 `key-visual`)를 만들고, 이후 각 자산을 그 앵커를 `--image`로 첨부 + 공통 스타일 프리앰블(BRAND_KIT/tokens)로 생성해 한 가족이 되게 한다. 아이콘은 가족 앵커(또는 첫 아이콘)를 `--image`로 시드.
- **품질/비용**: 초안 `--quality low`. **사진류(key-visual·ui)만 `--quality high` 락**, 로고·아이콘은 low(필요 시 medium). 아이콘은 오버뷰 표시 크기엔 low로 충분.
- **버전 보존**: 모든 재생성 `--auto-version`(해당 `assets/` 안에서 `-v2`… 누적). 락된 자산만 `final/brand-kit/assets/`로 복사.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로. 자산 아트 디렉션·로고/아이콘 청크는 `references/brand-kit-image.md`·`../references/design/logo-art-direction.md`·`../references/design/icon/icon-rules.md`.
- 호출 예(불투명 키비주얼 — 스타일 앵커):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <키비주얼 프롬프트 파일> \
    --out "<cwd>/.design/brand-kit/assets/key-visual.png" \
    --auto-version --model gpt-image-2 --size 1536x1024 --quality low
  ```
- 호출 예(투명 로고 마크 — 앵커 첨부):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <로고 프롬프트 파일> \
    --image "<cwd>/.design/brand-kit/assets/key-visual.png" \
    --out "<cwd>/.design/brand-kit/assets/logo-base.png" \
    --auto-version --model gpt-image-1.5 --background transparent --quality low --autocrop
  ```
- 호출 예(불투명 UI):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <ui 프롬프트 파일> \
    --image "<cwd>/.design/brand-kit/assets/key-visual.png" \
    --out "<cwd>/.design/brand-kit/assets/ui-base.png" \
    --auto-version --model gpt-image-2 --quality low
  ```

### overview.html 저작 (이미지 아님)

`overview.html`은 생성기로 만들지 않는다 — `references/brand-kit-html-direction.md`의 레이아웃 규칙을 가드레일로 **LLM이 저작**한다: 자산은 `<img>`(상대 경로), 데이터는 `BRAND_KIT.md`/tokens에서 렌더, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`, §1 워드마크는 `wordmark-base.png`를 `<img>`로. 콘텐츠를 지어내지 않는다(변주는 레이아웃만).

### 라이브 프리뷰 (자동 새로고침)

`overview.html`을 **처음 피드백용으로 제시할 때** 공유 런처로 로컬 라이브 서버를 **한 번 백그라운드로** 띄운다 — 이후 자산 재생성·HTML 외과 편집 때마다 브라우저가 자동 새로고침된다(수동 새로고침 불필요). watch·reload·브라우저 오픈은 `five-server`에 위임한다(우리는 구현하지 않음).

```
node ../../scripts/lib/serve-design.mjs <cwd>/.design/brand-kit
```

- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동(이후 같은 서버 유지).
- lock 후 또는 세션 종료 시 서버를 종료한다(`Ctrl+C`/백그라운드 종료 — 포트 점유 방지).

## 흐름 (디자이너 협업 루프)

1. **킷 작성 (분위기 분기)** — §1–11은 오버뷰 섹션과 1:1, §12는 md 전용. 분위기 **고정** → `.design/brand-kit/`에 단일 풀 `BRAND_KIT.md`·`brand-tokens.json`·`brief.md` 직행. 분위기 **열림** → `directions.json`(3방향 최소 데이터)을 작성한다(풀 킷 3벌이 아님). §8 폰트는 `../references/design/font-catalog.md`에서, §11 아이코노그래피는 `../references/design/icon/icon-rules.md`로 확정(폼 규칙 명시).
2. **brief 작성** — 고정이면 `.design/brand-kit/brief.md`. 열림이면 게이트에서 방향을 고른 뒤 그 1벌만 작성(Step 4). (자산·HTML 오버뷰·선택 추가탐색.)
3. **승인 게이트 (생성 전 필수)** — 분위기 **열림** → `build-contact-sheet.mjs`로 `directions.html`(3열 컨택트 시트)을 생성해 제시 → 한 열 선택. 분위기 **고정** → data-only `overview.html`(이미지 슬롯 플레이스홀더)을 제시 → 승인. 어느 쪽이든 게이트까지 이미지 0콜이며, 승인/선택 전 한 장도 생성하지 않는다.
4. **발산 → 전개 (분위기 열림일 때만; 고정이면 건너뜀)** — 고른 열의 방향을 `.design/brand-kit/`에 풀 `BRAND_KIT.md`·`brand-tokens.json`·`brief.md`로 인스턴스화하고 data-only `overview.html`을 저작한다. 데이터 섹션(§2·3·4·5·7·8·9)은 그 `brand-tokens.json`/`BRAND_KIT.md`에서 **공짜 HTML 렌더**(이미지 생성 0콜) — 이미지 슬롯은 플레이스홀더로 둔다. (분위기 고정이면 Step 1에서 이미 단일 킷이 있으므로 이 단계를 건너뛴다.)
5. **자산 생산 (`.design/brand-kit/assets/`)** — `key-visual`·`logo-base`·`wordmark-base`·`ui-base`·`icons/*` 생성(투명 라우팅·앵커 일관성·품질/비용 규율은 "이미지 생성" 참조). 자산별로 보여주고 → 한 번에 한 가지 증분 편집. §11 아이콘 목록(개수·라벨)은 도메인 근거로 제안·확정(과다 생성 주의).
6. **overview.html 마무리** — data-only `overview.html`의 이미지 슬롯 플레이스홀더를 실 자산(`assets/key-visual.png`·`assets/ui-base.png`·`assets/icons/*.png` 등)으로 채워 **재저작 또는 외과 편집**. 레이아웃 변경이면 재저작, 데이터·자산 교체만이면 외과 편집. 보여주고 피드백.
7. **(선택) 추가 탐색 이미지** — 1개씩 생성→피드백→증분 편집→lock.
8. **lock** — `.design/brand-kit/{BRAND_KIT.md,brand-tokens.json,overview.html,brief.md,assets/}`를 `.design/final/brand-kit/`로 **순수 복사**. 확정되면 산출물 경로를 제시하고 안내: **"다음 단계: `design-logo` → `design-iconset` → `design-page-image`"** (각자 `.design/brand-kit/assets/`를 시드로 읽음). 라이브 프리뷰 서버가 떠 있으면 종료한다(포트 점유 방지).
