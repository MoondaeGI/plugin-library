---
name: design-logo
description: 확정된 brand kit를 바탕으로 로고를 탐색·확정하는 스킬. brand-overview 보드에서 로고만 깨끗이 추출해 시드로 쓰고, 40개 컨셉이 한 장에 담긴 정사각 Logo Exploration Board를 만든 뒤, 보드를 첨부하고 셀 번호로 가리켜 수정해 고른 컨셉을 단독 로고로 만들고 (선택) wordmark·favicon·app-icon까지 .design/final/logo/에 확정할 때 사용한다.
---

# Design Logo

당신은 확정된 브랜드 킷에서 출발해 실제로 쓸 수 있는 로고를 좁혀가는 아이덴티티 디자이너다.

## 목적

`design-brand-kit`이 확정된 뒤 사용한다. 보드의 "로고 방향"은 한 칸짜리 제시일 뿐이라, 여기서 **브랜딩 스튜디오의 로고 탐색 시트**처럼 40개 컨셉을 한 장에 담아 보여주고, 사용자가 번호로 컨셉을 고르거나 배제하며 보드를 다시 그려 좁힌다. 고른 컨셉을 깨끗한 단독 로고로 다시 렌더해 다듬고, 확정 로고와 (선택) 로고 시스템(wordmark·favicon·app-icon)을 `.design/final/logo/`에 확정한다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다. 형태 언어·컨셉 방법·품질 테스트는 `../references/design/logo-art-direction.md`, 보드 레이아웃은 `references/logo-exploration-board.md`를 따른다.

## 전제

- `design-brand-kit` 산출물(`.design/final/brand-kit/assets/logo-base.png`·`.design/BRAND_KIT.md`·`.design/brand-tokens.json`)이 있으면 그걸 쓴다. **없으면 흐름 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 만들기 / 로고용 최소 Q&A로 바로 진행).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패). 키가 없으면 사람이 직접 드롭하는 폴백.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/final/brand-kit/assets/logo-base.png` — **확정 로고 마크 시드(투명).** 보드 재추출 없이 이 파일을 직접 시드로 쓴다.
- `.design/final/brand-kit/assets/wordmark-base.png` — 확정 워드마크 시드(투명). 로고 시스템(Phase 3) 워드마크를 이걸로 시드.
- `.design/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴, §8 타이포(워드마크용).
- `.design/brand-tokens.json` — 색 HEX·타이포.

> `logo-base.png`가 **없으면** Phase 0의 로고 Q&A로 최소 정보를 모은다 — 시드 없이 첫 보드는 텍스트→이미지.

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/generated/logo/seed.png` — 추출한 로고 시드(클린 단색 배경).
- `.design/generated/logo/exploration-board.png` (+`-v2`…) — 40컨셉 정사각 탐색 보드.
- `.design/generated/logo/logo-candidate.png` (+`-v2`…) — 고른 컨셉의 단독 로고 렌더.
- `.design/final/logo/logo.png` — 확정 단일 로고.
- `.design/final/logo/wordmark.png` · `favicon.png` · `app-icon.png` — (선택) 로고 시스템.
- `.design/image-briefs/logo-briefs.md` — 시드 출처·탐색 방향·제약 로그·확정 컨셉·로고 시스템 스펙.

시안은 `generated/logo/`에 `--auto-version`으로 누적(덮지 않음). 확정본만 `final/logo/`로 복사한다. **`final/logo`는 이 스킬이 단독으로 채운다** (brand-kit은 로고를 final로 잠그지 않는다).

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 로고 마크·워드마크·파비콘은 `gpt-image-1.5` + `--background transparent`(투명 PNG)로 생성한다. 앱 아이콘은 컬러 타일이므로 `gpt-image-2` 불투명(배경을 프롬프트로 "plain near-white/near-black background, no scenery" 지시). gpt-image-2는 투명 배경을 지원하지 않으므로, 불투명이 필요한 경우에만 gpt-image-2를 쓴다.
- **충실도(고정)**: gpt-image-2는 `--image`를 **항상 high fidelity**로 처리한다(`--input-fidelity` 미지원 — 스크립트에서 제거됨). "편집(보존)이냐 참고(새로)냐"는 **프롬프트 문구**로 표현한다 — 추출·번호 수정·다듬기·로고시스템은 "보존", 더 새로운 보드를 원하면 시드만 첨부.
- **셀 참조 = 보드 첨부 + 번호**: 사용자가 "N번"으로 가리키면 **해당 보드를 `--image`로 첨부**하고 프롬프트엔 번호만 쓴다. 형태를 말로 번역하지 않는다 — 모델이 번호 셀을 직접 본다.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 `-v2`·`-v3`… 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 보드 프롬프트는 `references/logo-exploration-board.md` 템플릿, 단독 로고는 `../references/design/logo-art-direction.md` §7 풀 청크.
- 호출 예(보드 생성):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <보드 프롬프트 파일> \
    --image "<cwd>/.design/generated/logo/seed.png" \
    --out "<cwd>/.design/generated/logo/exploration-board.png" \
    --auto-version --size 1024x1024 --quality low --model gpt-image-2
  ```

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/BRAND_KIT.md`와 `.design/final/brand-kit/assets/logo-base.png` 존재를 확인한다.
- **있으면** → Phase 1로(시드 직접 사용).
- **없으면** → 두 길을 제시하고 고르게 한다:
  - **(1) 브랜드 킷 먼저** — "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·타이포·보이스까지 갖춰 마크 근거가 탄탄)". 고르면 design-brand-kit을 안내하고 종료.
  - **(2) 로고용 최소 Q&A** — 여기서 바로 진행. 로고에 필요한 최소 정보를 **한 번에 하나씩** 묻는다: 제품명·한 줄 소개 / 분야 / 브랜드 성격·톤(페르소나 한 줄) / 핵심 메타포·심볼 방향 / 색(HEX 또는 방향) / 워드마크 타입 방향 / 피할 클리셰. 추측 금지 — 답으로 마크 방향·색을 정할 수 있을 때까지 파고든다. 수집분을 `logo-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). **시드 추출(Phase 1)은 건너뛰고** Phase 2의 보드 생성을 **텍스트→이미지**(시드 미첨부, Q&A 마크 DNA를 프롬프트에 채움)로 한다. 끝에 "더 완전한 시스템(색·타이포·보이스)이 필요하면 design-brand-kit"을 안내.

### Phase 1 — 시드 + 승인 게이트 (brand kit가 있을 때)
1. 입력 읽기(BRAND_KIT.md §6·tokens·확정 보드).
2. **시드 = `assets/logo-base.png` 직접.** brand-kit이 이미 깨끗한 투명 로고 마크를 생산했으므로 **보드에서 재추출하지 않는다**(재추출이 드리프트의 원인이었다). 그대로 `generated/logo/seed.png`로 복사하거나 경로를 그대로 시드로 쓴다. 보여주고 "이 마크 맞아요?" 확인.
   - **로고 (I) 단일 커밋**: 사용자가 `logo-base`를 그대로 확정할 수 있다. 더 탐색하고 싶을 때만 40컨셉 보드로 간다(아래 **탐색 opt-in**).
3. `logo-briefs.md` 작성(시드 출처·탐색 방향·컨셉 방법 분포·제약).
4. **승인 게이트 (보드 생성 전 필수)**: 시드 + brief를 제시하고 방향 확인. 이미지는 실비가 들고 brief가 어긋나면 보드를 통째로 날리므로 텍스트 단계에서 잡는다. 승인 전엔 보드를 생성하지 않는다.

### Phase 2 — 탐색 보드 → 단독 로고 확정

**탐색은 opt-in.** `logo-base`가 만족스러우면 Phase 2의 탐색 보드를 건너뛰고 바로 단독 로고 확정(7단계)→로고 시스템(Phase 3)으로 간다. "다른 방향도 보고 싶다"일 때만 40컨셉 탐색 보드를 만든다. 탐색·단독 로고 생성 시 컷아웃은 `--model gpt-image-1.5 --background transparent`(투명).

5. **보드 생성**: 보드 프롬프트(`--size 1024x1024`, `--quality low`) → `exploration-board.png`. 40개 번호 컨셉을 보여준다. brand kit 경로는 `--image seed.png`(모티브)를 첨부하고, **brand kit 없이 진행하는 경우(Phase 0의 (2))는 `--image` 없이** Q&A 마크 DNA를 보드 프롬프트(`Mark DNA`·`[BRAND NAME]`)에 채워 텍스트→이미지로 생성한다.
6. **수정 루프**: 사용자가 "N번 기준 다시" / "N·M 모양 별로"라고 하면 — **직전 보드를 `--image`로 첨부** + 프롬프트엔 번호만: "이 보드 기준으로 다시 만들되 #N 방향을 살려 40칸을 다시 그리고, #M·#K 계열은 빼고 대체". gpt-image-2는 항상 high fidelity라 좋은 칸은 유지되고 지목 방향으로 옮겨간다. 더 과감한 새 보드를 원하면 보드 대신 **시드만 첨부**. `--auto-version`. 원하는 컨셉이 보일 때까지 반복.
7. **단독 로고**: 사용자가 #N을 고르면 — **그 보드를 `--image`로 첨부** + "첨부 보드 #N 칸의 마크만 크고 깨끗한 단독 로고로 재현, 중앙 정렬, plain 단색 배경, 형태·기하 유지, 브랜드 컬러 <HEX>, 단일 마크만(보드 아님)". `--quality high` → `logo-candidate.png`. `logo-art-direction.md` §7 품질 프레이밍 문구를 덧붙이고 §8 품질 테스트로 자가 판정(떨어지면 §1·§2·§7 보강해 재시도).
8. **다듬기 루프**: 직전 후보를 `--image`로 첨부해 한 번에 한 가지만 증분 편집(gpt-image-2가 나머지를 보존), `--auto-version`. lock까지.
9. **확정(복사)**: 확정본을 `.design/final/logo/logo.png`로 복사. 시안은 `generated/logo/`에 보존.

### Phase 3 — (선택) 로고 시스템
10. logo.png lock 후 "워드마크 / 파비콘 / 앱 아이콘도 만들까요?"라고 제안한다. 원하는 것만, **확정 logo.png를 `--image`로 첨부**해 한 개씩 생성→보여줌→다듬기→lock:
    - **wordmark**: "<제품명>을 BRAND_KIT §8 타입 방향으로 워드마크화, 심볼+워드마크 락업 또는 워드마크 단독, plain 단색 배경" → `wordmark.png`.
    - **favicon**: "이 마크를 16/24/32px에서 읽히게 단순화, 단색, 정사각, plain 단색 배경" → `favicon.png`.
    - **app-icon**: "이 마크를 라운드 사각 앱 아이콘 타일에 배치, 브랜드 컬러 배경, iOS/Android 앱 아이콘 스타일, 넉넉한 패딩" → `app-icon.png`.
    - 각 확정본을 `final/logo/`로 복사, `logo-briefs.md`에 로고 시스템 스펙을 기록.
11. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

## 품질 기준 / 금지 사항

- 보드는 한 장에 40개 번호 컨셉이 또렷이 읽혀야 한다 — `references/logo-exploration-board.md` 따름.
- 단독 로고는 `../references/design/logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미)를 통과해야 한다.
- 로고 마크·워드마크·파비콘 배경은 투명(gpt-image-1.5). 앱 아이콘은 gpt-image-2 불투명 컬러 타일.
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 있는 로고, 보드 셀마다 다른 스타일 난립, 유명 마크 모방 (§6·§9).
- 한글 워드마크는 짧고 단순하게, 정확한 문구의 권위 원본은 `BRAND_KIT.md`.
