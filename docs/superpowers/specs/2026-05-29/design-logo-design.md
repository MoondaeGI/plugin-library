# design-logo 스킬 설계

- 날짜: 2026-05-29
- 상태: 설계 승인 대기
- 관련: `design-brand-kit`(상류), `design-page-image`(하류), 공유 `image-gen` 스킬, 공유 ref `skills/references/design/logo-art-direction.md`

## 1. 배경 / 문제

`design-brand-kit`은 종합 브랜드 보드를 확정하고, 그 안에 "로고 방향" 섹션과 (선택) 독립 단색 로고를 만든다. 하지만 **실제로 쓸 수 있는 확정 로고를 협업으로 좁혀가는 전용 단계가 없다.** 보드의 로고 섹션은 한 칸짜리 방향 제시일 뿐이고, brand-kit의 단독 로고는 단발 생성이라 "여러 컨셉을 펼쳐 보고 고르고 다듬는" 루프가 빠져 있다.

`design-logo`는 brand-kit이 확정된 뒤, **브랜딩 스튜디오의 로고 탐색 시트(40개 컨셉이 한 장에 담긴 보드)** 를 만들고, 사용자가 번호로 컨셉을 고르거나 배제하며 보드를 다시 그려 좁혀, 최종 단일 로고와 로고 시스템(wordmark·favicon·app-icon)을 `.design/final/logo/`에 확정하는 협업 스킬이다.

## 2. 목표 / 비목표

**목표**
- brand-kit 보드에서 **로고만 깨끗한 단색 배경으로 추출**해 탐색의 시드 모티브로 쓴다 (gpt-image-2는 투명 미지원 — clean opaque 배경 사용, §3).
- 40개 컨셉이 한 장에 담긴 정사각 보드를 생성하고, **보드 이미지를 첨부 + 셀 번호 참조**로 수정한다(말로 형태를 번역하지 않는다).
- 고른 컨셉을 깨끗한 단독 로고로 렌더·다듬어 `.design/final/logo/logo.png`로 확정한다.
- (선택) wordmark·favicon·app-icon 파생물을 같은 루프로 만든다.

**비목표 (YAGNI — 지금 하지 않음)**
- UI 아이콘 세트 생성(그건 `icon-art-direction.md` + 미래 `design-icon`의 몫).
- px 단위 클리어스페이스 다이어그램·익스포트 포맷 매트릭스 등 사람용 deliverable 스펙(이미지 모델이 렌더 못 함).
- 흑/백 단색 변형 파일 자동 생성(요청 시에만; §8 품질 테스트로 단색 성립은 이미 검증).
- 벡터(SVG) 출력 — 이미지 모델은 래스터만 낸다.

## 3. 핵심 결정 (확정)

| 항목 | 결정 | 근거 |
|---|---|---|
| 파이프라인 위치 | brand-kit 확정 후 실행, page-image 앞 | 보드(전략·색·타이포·로고 방향)가 확정돼야 시드·프롬프트가 성립 |
| 시드 출처 | **항상 존재하는 `.design/final/brand-kit/brand-overview.png`에서 로고만 추출**. `generated/logo/brand-kit-logo.png`(brand-kit 시드)가 있으면 우선 | brand-kit 단독 로고는 *선택* 산출물 → 시드 부재 문제를 보드 추출로 제거 |
| `final/logo` 소유권 | **design-logo 단독**. brand-kit은 `final/logo`를 만들지 않고 자기 로고를 `generated/logo/brand-kit-logo.png` 시드로만 둔다(§5.1) | 두 스킬이 같은 폴더를 쓰는 충돌 제거; `final/logo` 권위를 design-logo로 단일화 |
| 배경 | **전부 gpt-image-2 + 클린(opaque) 단색 배경** (투명 미사용) | gpt-image-2가 `background:transparent`를 지원하지 않음(OpenAI 공식 문서 확인). 단일 모델·최상 보드 품질 우선. `image-gen --background` 추가는 **불필요 → 드롭**(opaque는 gpt-image-2 기본 동작이라 무의미) |
| 셀 참조 | 번호로 가리키면 **보드를 `--image`로 첨부 + 프롬프트엔 번호만**. 말로 형태 번역 금지 | 시드 추출과 동일 원리. 번역은 정보 손실·오류. 모델이 번호 셀을 직접 봄 |
| 보드 컨셉 수 | **40개 고정**(8×5), 사용자 요청 시 조절 | 예시 보드가 40개. 기본은 고정, 유연성만 남김 |
| 보드 ref 위치 | **`skills/design-logo/references/logo-exploration-board.md`**(스킬 폴더 내부) | 이 스킬에서만 쓰는 보드 레이아웃 지식. brand-kit이 `references/brand-kit-image.md`를 자기 폴더에 둔 것과 동일 패턴 |
| 형태 언어 출처 | 공유 `skills/references/design/logo-art-direction.md`(§1–5·§7·§8) 재사용 | 컨셉 방법·기하·품질 테스트는 이미 공유 ref에 있음. 보드 ref는 레이아웃만 |
| 최종 확정 흐름 | 보드 1장(40그리드) → 번호로 수정 → 고른 컨셉 단독 재렌더 | 보드 셀은 작고 저화질 → 그대로 못 씀. 깨끗한 단독 마크로 다시 그림 |
| brief 문서 | `.design/image-briefs/logo-briefs.md` 생성 | 다른 디자인 스킬과 일관. 승인 게이트에서 방향을 텍스트로 먼저 잡음 |
| brand kit 부재 시 | **감지 후 선택 제시** — (1) design-brand-kit 먼저 / (2) 로고용 최소 Q&A 후 진행 | 품질 경로와 빠른 편의 경로 둘 다 제공. (2)는 시드가 없으므로 첫 보드를 텍스트→이미지로, 수집분은 `logo-briefs.md`에(가짜 BRAND_KIT.md 금지) |

## 4. 파일 구조 / 상대경로

```
skills/design-logo/
  SKILL.md
  references/
    logo-exploration-board.md   (신규 — 보드 레이아웃 아트 디렉션)
```

`SKILL.md` 기준 상대경로(검증 필요):
- 보드 ref: `references/logo-exploration-board.md`
- 공유 로고 ref: `../references/design/logo-art-direction.md`
- image-gen 스크립트: `../image-gen/scripts/image-gen.mjs`

(brand-kit `SKILL.md`이 `../image-gen/...`·`../references/design/...`를 쓰는 형제 참조 패턴과 동일.)

## 5. image-gen 변경 — 불필요 (드롭)

당초 `image-gen.mjs`에 `--background transparent`를 추가하려 했으나, **gpt-image-2가 `background:transparent`를 지원하지 않고**(OpenAI 공식 문서 확인) design-logo는 전부 **gpt-image-2 + 클린 단색 배경**으로 가기로 했다(§3). 클린 단색 배경은 프롬프트 문구("plain near-white/near-black background, no scenery")로 충분하고, `opaque`는 gpt-image-2의 기본 동작이라 새 옵션이 무의미하다 → **`image-gen.mjs`는 손대지 않는다.** (추후 진짜 투명이 필요해지면 그때 transparent-지원 모델 + `--background`를 함께 도입.)

## 5.1 design-brand-kit 변경 (final/logo 비생성)

`final/logo` 권위를 design-logo로 단일화하기 위해 brand-kit이 자기 로고를 `final/logo`로 잠그던 동작을 제거한다.

- `design-brand-kit/SKILL.md` + `references/brand-kit-image.md`에서 (선택) 단색 로고를 **`final/logo/`로 복사하던 단계 제거**.
- 로고 파일명 `logo-concept-1.png` → **`brand-kit-logo.png`**, 위치는 `.design/generated/logo/`만(확정 복사 없음 — 시드로만 보존).
- 출력 파일 목록의 `.design/final/{brand-kit,logo}/` → `.design/final/brand-kit/`(logo 제외).
- 흐름의 로고 lock/복사 문구를 "시안 보존(복사 안 함)"으로 수정.
- 다운스트림(md-compiler·html-prototype)이 `.design/final/**`를 읽으므로, brand-kit 로고가 final에 없어도 영향 없음(원래 *선택* 산출물). design-logo가 `final/logo/logo.png`를 채운다.

## 6. SKILL.md 구조

frontmatter: `name: design-logo`, 한국어 `description`(파이프라인 위치·brand-kit 확정 후 사용·40컨셉 보드·번호 참조 수정·final/logo 확정 명시). 본문(다른 design 스킬 톤·한국어):

- **목적** — brand-kit 확정 후, 40그리드 로고 탐색 보드를 만들고 번호로 수정해 확정 로고+시스템을 만든다.
- **입력 파일** — `.design/BRAND_KIT.md`(§6 로고 방향·§1 개요·금지 패턴), `.design/brand-tokens.json`(색 HEX·타이포), `.design/final/brand-kit/brand-overview.png`(시드 출처), (있으면) `.design/generated/logo/brand-kit-logo.png`(brand-kit 시드 — 있으면 우선).
- **출력 파일** — §7.
- **이미지 생성(공유 image-gen)** — 스크립트 경로·`--auto-version`·`--image` 사용법(brand-kit SKILL.md "이미지 생성" 절과 동일 톤). **전부 gpt-image-2 + 클린 단색 배경**(투명 미사용; 배경은 프롬프트로 "plain background, no scenery").
- **셀 참조 원칙** — 번호로 가리키면 보드를 `--image`로 첨부하고 번호만 넘긴다(말로 번역 금지).
- **흐름** — §8 Phase 1–3.
- **품질 기준 / 금지 사항** — `logo-art-direction.md` §6·§8·§9 참조 + 보드 ref.

## 7. 산출물 (대상 프로젝트 cwd 기준)

| 경로 | 내용 | 배경 |
|---|---|---|
| `.design/generated/logo/seed.png` | 보드(또는 기존 단독 로고)에서 추출한 로고-only 시드 | 클린 단색 |
| `.design/generated/logo/exploration-board.png` (+`-v2`…) | 40컨셉 정사각 탐색 보드, 버전 누적 | 클린(시트 캔버스) |
| `.design/generated/logo/logo-candidate.png` (+`-v2`…) | 고른 컨셉을 단독 로고로 렌더·다듬기 | 클린 단색 |
| `.design/final/logo/logo.png` | 확정 단일 로고(lock 시 복사) | 클린 단색 |
| `.design/final/logo/wordmark.png` | (선택) 워드마크/락업 | 클린 단색 |
| `.design/final/logo/favicon.png` | (선택) 16/24/32px용 단순 단색 마크 | 클린 단색 |
| `.design/final/logo/app-icon.png` | (선택) 라운드 사각 앱 아이콘 타일 | 불투명(타일) |
| `.design/image-briefs/logo-briefs.md` | 시드 출처·탐색 방향·제약 로그·확정 컨셉·로고 시스템 스펙 | — |

> 배경은 전부 **클린 단색(opaque)** — gpt-image-2가 투명을 지원하지 않으므로 알파 채널이 없다. 사용자 수용함. 다운스트림에서 다크 배경 위에 올리면 단색 박스가 보일 수 있다(허용된 트레이드오프; 추후 진짜 투명이 필요하면 transparent-지원 모델로 그 단계만 재생성).

네이밍: 시안은 `generated/logo/`에 `--auto-version`으로 누적(덮지 않음). 확정본만 `final/logo/`로 복사(버전 접미 뗀 의미 이름). brand-kit은 더 이상 `final/logo`를 만들지 않으므로(§5.1) 충돌 없음 — design-logo가 `final/logo`의 단독 권위. brand-kit 시드 `generated/logo/brand-kit-logo.png`는 시안으로 보존된다.

## 8. 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/BRAND_KIT.md` + `.design/final/brand-kit/brand-overview.png` 존재 확인.
- **있으면** → Phase 1.
- **없으면** → 선택 제시: **(1)** design-brand-kit 먼저(권장; 안내 후 종료) / **(2)** 로고용 최소 Q&A(제품명·분야·성격·핵심 메타포·색·워드마크 타입·금지)를 한 번에 하나씩 → `logo-briefs.md`에 기록 → 시드 추출(Phase 1) 건너뛰고 Phase 2의 보드 생성을 **텍스트→이미지**로(시드 미첨부). 끝에 design-brand-kit 권유.

### Phase 1 — 시드 + 승인 게이트 (brand kit가 있을 때)
1. 입력 읽기(BRAND_KIT.md §6·tokens·확정 보드).
2. **시드 추출**: 보드를 `--image`로 첨부 + 프롬프트 "이 보드에서 로고 마크만 깨끗이 중앙에 재현, plain near-white 단색 배경(no scenery), 텍스트·다른 섹션 제외, 단일 마크만" → `seed.png`(gpt-image-2, `--quality low` 가능). 보여주고 "이 마크 맞아요?" 확인. (`generated/logo/brand-kit-logo.png`가 있으면 추출 대신 그걸 시드로.)
3. `logo-briefs.md` 작성(시드 출처·탐색 방향·컨셉 방법 분포·제약).
4. **승인 게이트(보드 생성 전 필수)**: 시드 + brief 제시, 방향 확인. 이미지 실비가 들고 brief가 어긋나면 보드를 통째로 날리므로 텍스트 단계에서 잡는다. (brand-kit의 사전 승인 게이트와 동일 철학.)

### Phase 2 — 탐색 보드 → 단독 로고 확정
5. **보드 생성**: 보드 프롬프트(`logo-exploration-board.md` 템플릿, `--size 1024x1024`, `--quality low`) → `exploration-board.png`. brand kit 경로는 `--image seed.png`(모티브) 첨부; Phase 0의 (2)는 `--image` 없이 Q&A 마크 DNA를 프롬프트에 채워 텍스트→이미지. 40개 번호 컨셉을 보여줌.
6. **수정 루프**: "N번 기준 다시" / "N·M 모양 별로" → **직전 보드를 `--image`로 첨부** + 프롬프트엔 셀 번호만(예: "이 보드 기준 #N 방향 살려 40칸 다시, #M·#K 계열 빼고 대체"). gpt-image-2는 항상 high fidelity라 좋은 칸은 유지되고 지목 방향으로 옮겨간다(번호 수정 = 보드 편집). 더 과감한 새 보드는 보드 대신 **시드만 첨부**. `--auto-version` → `-v2`…. 원하는 컨셉이 보일 때까지 반복.
7. **단독 로고**: 고른 #N → **그 보드를 `--image`로 첨부** + "첨부 보드 #N 칸의 마크만 크고 깨끗한 단독 로고로 재현, 중앙 정렬, plain 단색 배경, 형태·기하 유지, 브랜드 컬러 [HEX], 단일 마크만(보드 아님)". `--quality high`. logo-art-direction §7은 **품질 프레이밍 문구**로만 덧붙임(형태 지시는 보드 셀이 진실) → `logo-candidate.png`. §8 품질 테스트 자가 판정 후 보여줌.
8. **다듬기 루프**: 직전 후보를 `--image`로 첨부해 한 번에 한 가지만 증분 편집(gpt-image-2가 나머지 보존). lock까지.
9. **확정(복사)**: 확정본 → `.design/final/logo/logo.png`. 시안은 generated에 보존.

### Phase 3 — (선택) 로고 시스템
10. logo.png lock 후 "워드마크/파비콘/앱아이콘도 만들까요?" 제안. 원하는 것만, **확정 logo.png를 `--image`로 첨부**해 한 개씩 생성→보여줌→다듬기→lock:
    - **wordmark**: 브랜드명을 BRAND_KIT §8 타입 방향으로, 심볼+워드마크 락업 또는 단독, plain 단색 배경 → `wordmark.png`.
    - **favicon**: 16/24/32px에서 읽히게 단순화한 단색 정사각 마크, plain 단색 배경 → `favicon.png`.
    - **app-icon**: 라운드 사각 타일에 마크(브랜드 컬러 배경, iOS/Android 스타일, 넉넉한 패딩) → `app-icon.png`.
    - 각 확정본을 `final/logo/`로 복사, `logo-briefs.md`에 시스템 스펙 기록.
11. 산출 경로 제시 + "다음 단계: `design-page-image`" 안내.

## 9. logo-exploration-board.md (보드 ref) 내용 개요

- **목적/사용법** — `design-logo`가 40컨셉 탐색 보드를 그릴 때 읽는다. 형태 언어·컨셉 방법·품질 테스트는 `../../references/design/logo-art-direction.md`(§1–5·§7·§8) 참조; 이 파일은 **보드 레이아웃·시트 미감·셀 참조·수정 스티어링**만 다룬다.
- **보드 레이아웃** — 정사각 캔버스, 번호(01–40) 매긴 모듈러 그리드(8×5), 얇은 디바이더, 헤더(브랜드명 / "LOGO EXPLORATION" / 한 줄 라벨), 푸터(태그라인·"BRAND STUDIO" 류). 브랜딩 스튜디오 아이덴티티 컨셉 시트 미감.
- **컨셉 분포** — 40칸을 logo-art-direction §2 5방법(모노그램+의미·제품 액션·메타포 융합·네거티브 스페이스·구성 기하)과 §4 유형(워드마크/레터마크/심볼/콤비/엠블럼)에 걸쳐 다양하게. 시드 모티브의 코어 아이디어를 유지하되 형태를 발산.
- **시드 모티브 사용** — 시드 PNG(`seed.png`)를 `--image`로 첨부(gpt-image-2는 항상 high fidelity), 40개 변주는 프롬프트 문구로 유도.
- **셀 참조 = 보드 첨부 + 번호(말 번역 금지)** — 수정 시 직전 보드를 `--image`로 첨부하고 프롬프트엔 번호만. high fidelity라 번호 수정 = 보드 편집(좋은 칸 유지, 지목 방향으로). 더 과감하면 시드만 첨부. 스티어링 델타("#N 방향 살려 다시" / "#M·#K 빼고 대체") 작성법.
- **금지 사항** — 셀마다 다른 스타일 난립(브랜드 일관성 상실), 읽히지 않는 미세 디테일, 번호 누락/중복, 한 칸에 여러 마크, logo-art-direction §6 클리셰.
- **보드 프롬프트 청크 템플릿** — `--prompt-file`로 넘길 본문(brand-kit-image.md §12 템플릿 스타일).

## 10. 동기화

스킬·ref 추가 및 brand-kit 수정 후 `npm run sync`로 Codex 번들(`plugins/personal/`) 재생성. 번들은 gitignore된 로컬 생성물 → 소스(`skills/design-logo/`, `design-brand-kit` 수정분)만 커밋, 번들은 커밋 제외.

## 11. 검증

1. **깨진-링크 확인** — SKILL.md의 보드 ref·공유 ref·스크립트 상대경로가 실제 파일을 가리키는지. brand-kit에 `logo-concept-1`·`final/{brand-kit,logo}` 잔여 참조가 없는지(grep).
2. **회귀 테스트** — `npm test` 전체 green(소스 변경은 마크다운뿐이라 코드 테스트에 영향 없음; 새 스킬 폴더는 sync 테스트에 영향 없음 — 확인됨).
3. **번들 확인** — `npm run sync` 후 `plugins/personal/skills/design-logo/`(+`references/`)가 복사됐는지.
4. **실효 검증(선택, API 비용)** — 가짜 테스트 브랜드 보드로 시드 추출→보드 1장(`--quality low`) 생성해 흐름이 도는지. **API 호출 직전 사용자 확인 후 실행.**

> CLAUDE.md: 명령 실행(`npm run sync`·`npm test`·API 생성)과 커밋은 **실행 전 사용자 승인**.

## 12. 리스크

- **보드 셀에서 단독 마크 추출 신뢰도** — 보드 전체를 첨부하고 "#N 칸만"이라 해도 모델이 보드 레이아웃째 재현할 위험. 프롬프트에 "단일 마크만, 보드 아님" 명시 + 안 되면 재시도(다듬기 루프가 흡수). 추후 셀 크롭 단계는 별도 enhancement(지금 비목표).
- **투명 미지원(gpt-image-2)** — 로고/wordmark/favicon이 알파 없는 클린 단색 배경 → 다크 배경 위 배치 시 단색 박스. 사용자 수용함. 추후 진짜 투명이 필요하면 그 단계만 transparent-지원 모델로 재생성.
- **기존 테스트 영향** — `tests/`의 sync 테스트는 합성 임시 디렉터리만 쓰므로 새 스킬 폴더로 깨지지 않음(확인됨). 소스 변경은 마크다운뿐.
- **한글 워드마크 렌더** — favicon/wordmark의 한글 글리프 부정확. logo-art-direction §5 한글 캐비엇대로 짧고 단순하게, 권위 문구는 BRAND_KIT.md.

## 13. 실행 순서 (개요 — 상세는 plan에서)

1. `design-brand-kit` 변경(§5.1): `SKILL.md`·`brand-kit-image.md`에서 logo의 final 복사 제거, 파일명 `brand-kit-logo.png`로, 출력 목록 `final/{brand-kit,logo}` → `final/brand-kit`.
2. `skills/design-logo/references/logo-exploration-board.md` 작성.
3. `skills/design-logo/SKILL.md` 작성.
4. 상대경로·깨진-링크 확인(grep).
5. `npm run sync` — *실행 전 확인*. 번들 확인.
6. `npm test` 전체 green — *실행 전 확인*.
7. (선택) 실효 검증 — *API 호출 전 확인*.
