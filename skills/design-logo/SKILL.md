---
name: design-logo
description: 확정된 brand kit를 바탕으로 로고를 탐색·확정하는 스킬. brand-kit이 만든 assets/logo-base.png(투명)를 시드로, 한 라운드에 3~4개의 큰 방향(메타포까지 발산)을 개별 투명 PNG로 만들어 저작한 logos.html 탐색 시트(번호·라벨·실색·실폰트)로 보여주고, #N을 골라 수렴 라운드 또는 단독 확정으로 좁힌 뒤 (선택) wordmark·favicon·app-icon까지 .design/final/logo/에 확정할 때 사용한다.
---

# Design Logo

당신은 확정된 브랜드 킷에서 출발해 실제로 쓸 수 있는 로고를 좁혀가는 아이덴티티 디자이너다.

## 목적

`design-brand-kit`이 확정된 뒤 사용한다. 보드의 "로고 방향"은 한 칸짜리 제시일 뿐이라, 여기서 **브랜딩 스튜디오의 로고 탐색**처럼 한 라운드에 **3~4개의 큰 방향**(메타포까지 갈라진 발산)을 개별 투명 PNG로 만들어 저작한 **`logos.html` 탐색 시트**(번호·방향 라벨·실색·실폰트)로 보여준다. 사용자가 `#N`을 고르면 그 방향으로 **수렴 라운드**(3~4 변주)를 더 돌거나 **바로 단독 확정**한다. 고른 PNG는 이미 깨끗한 컷아웃이라 보드 셀 재추출이 없다. 확정 로고와 (선택) 로고 시스템(wordmark·favicon·app-icon)을 `.design/final/logo/assets/`에 확정한다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다. 형태 언어·컨셉 방법·품질 테스트는 `../references/design/logo-art-direction.md`, 시트 저작은 `references/logo-sheet-html-direction.md`를 따른다.

## 전제

- `design-brand-kit` 산출물(`.design/final/brand-kit/assets/logo-base.png`·`BRAND_KIT.md`·`brand-tokens.json`)이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 로고용 최소 Q&A).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패).
- `logos.html`은 이미지가 아니라 `references/logo-sheet-html-direction.md`를 가드레일로 **LLM이 저작**한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/final/brand-kit/assets/logo-base.png` — **확정 로고 마크 시드(투명).** 모드 A·베이스라인 타일·로고 시스템 시드.
- `.design/final/brand-kit/assets/wordmark-base.png` — 확정 워드마크 시드(투명). 로고 시스템(Phase 3) 워드마크 시드.
- `.design/final/brand-kit/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴, §8 타이포(워드마크용).
- `.design/final/brand-kit/brand-tokens.json` — 색 HEX·타이포(시트 실색·실폰트).

> `logo-base.png`가 **없으면** Phase 0에서 brand-kit 안내 또는 로고 Q&A로 진행한다(아래 흐름).

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  logo/
    logos.html                       # 현재 라운드 시트 (교체, assets/ 상대경로 <img>)
    logo-briefs.md                   # 시드 출처·발산 모드·라운드 로그·확정 컨셉·시스템 스펙
    assets/
      seed.png                       # logo-base 복사/참조 (모드 A·C 앵커)
      seed-user.png                  # (선택) 사용자 첨부 이미지
      concepts/round-N/01..04.png    # 라운드별 개별 투명 PNG (--auto-version)
      logo-candidate.png (+v2…)      # 고른 #N 단독 다듬기
  final/logo/
    assets/  logo.png · wordmark.png · favicon.png · app-icon.png   # lock 세트
```

- `logos.html`의 모든 `<img>`는 형제 `assets/` 상대경로(`assets/concepts/round-N/01.png`·`assets/seed.png`) → `.design/logo/`든 복사본이든 동일 동작.
- 탐색 시트(`logos.html`)는 **작업 산출물** — final로 잠그지 않는다. 시안은 `.design/logo/assets/`에 `--auto-version`으로 누적. 확정 단일 로고·시스템만 `final/logo/assets/`로 복사한다. **`final/logo`는 이 스킬이 단독으로 채운다**(brand-kit은 로고를 final로 잠그지 않는다).

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 로고 마크·워드마크·파비콘은 `gpt-image-1.5` + `--background transparent --autocrop`(투명 PNG, 여백 제거). 앱 아이콘만 `gpt-image-2` 불투명(배경을 프롬프트로 "plain near-white/near-black background, no scenery" 지시). **투명 컷아웃은 `--autocrop`을 붙여 마크가 캔버스를 꽉 채우게 한다.**
- **개별 PNG, 그리드 아님**: 40칸 그리드 합성은 더 안 쓴다. 컨셉마다 단독 마크 PNG 1장씩 생성한다.
- **한 라운드 3~4콜 = 병렬 백그라운드**: 서로 다른 컨셉은 `image-gen`을 동시(백그라운드) 호출해 병렬 생성(순차는 느림). 다듬기 루프는 순차.
- **충실도**: 컷아웃은 `gpt-image-1.5`다. 앵커(모드 A·C·수렴·다듬기)는 `--image --input-fidelity high`로 첨부해야 입력 마크에 단단히 묶인다(미지정이면 기본 low로 느슨하게 참조). 발산 모드 B는 미첨부(완전 발산). "보존이냐 새로냐"는 **시드 첨부 여부 + input-fidelity**로 표현한다.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 컷아웃 청크는 `references/logo-sheet-html-direction.md` §8, 단독 로고 품질 프레이밍은 `../references/design/logo-art-direction.md` §7.
- 호출 예(발산 컨셉 1개 — 모드 B, 시드 미첨부):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --out "<cwd>/.design/logo/assets/concepts/round-1/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --autocrop --quality low
  ```
- 호출 예(모드 A/C·수렴 — 앵커 첨부, **high fidelity로 묶음**):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --image "<cwd>/.design/logo/assets/seed.png" --input-fidelity high \
    --out "<cwd>/.design/logo/assets/concepts/round-2/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --autocrop --quality low
  ```

### logos.html 저작 (이미지 아님)

`logos.html`은 생성기로 만들지 않는다 — `references/logo-sheet-html-direction.md`의 레이아웃 규칙을 가드레일로 **LLM이 저작**한다: 자산은 `<img>`(상대경로), 브랜드명·태그라인은 `BRAND_KIT.md`에서, 색은 `brand-tokens.json` 실값, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`. 카드 라벨은 그 라운드에서 실제 만든 컨셉 방향을 가리킨다(지어내지 않음). `logo-base.png`는 베이스라인 타일(#0)로 고정.

### 라이브 프리뷰 (자동 새로고침)

`logos.html`을 **처음 제시할 때** 공유 런처로 로컬 라이브 서버를 **한 번 백그라운드로** 띄운다 — 이후 PNG 재생성·HTML 편집 때마다 자동 새로고침.

```
node ../../scripts/lib/serve-design.mjs <cwd>/.design/logo
```

- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동. lock 후/세션 종료 시 서버를 종료한다(포트 점유 방지).

## 흐름 (디자이너 협업 루프)

### Phase 0 — 입력 감지 (시작 시 필수)

- `.design/final/brand-kit/BRAND_KIT.md`와 `.design/final/brand-kit/assets/logo-base.png` 존재, 그리고 **사용자 첨부 이미지** 유무를 확인한다.
- **사용자 첨부 이미지가 있으면** → `.design/logo/assets/seed-user.png`로 저장하고 **역할을 묻는다**:
  - **"이 방향으로 발산"** → Phase 2 발산 모드 C(그 이미지를 앵커로; brand-kit이 있으면 tokens·BRAND_KIT.md도 함께 읽어 시트 실색·실폰트·베이스라인에 쓴다).
  - **"이걸 다듬자/확정"** → Phase 2 단독 다듬기 루프로 직행(그 이미지를 시드로).
- **brand-kit이 있으면** → Phase 1.
- **brand-kit이 없으면** → 묻는다: "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·타이포·보이스까지 갖춰 마크 근거가 탄탄)".
  - **예** → design-brand-kit을 안내하고 종료.
  - **아니오** → **로고용 최소 Q&A**(한 번에 하나씩): 제품명·한 줄 소개 / 분야 / 브랜드 성격·톤 / 핵심 메타포·심볼 방향 / 색(HEX 또는 방향) / 워드마크 타입 방향 / 피할 클리셰. 추측 금지. 수집분을 `logo-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). 이 경우 Phase 2는 **발산 모드 B 고정**(시드 미첨부, 텍스트→이미지). 끝에 "더 완전한 시스템이 필요하면 design-brand-kit"을 안내.

### Phase 1 — 시드 + 승인 게이트 (brand kit가 있을 때)

1. 입력 읽기(`BRAND_KIT.md` §6·tokens·assets/logo-base.png).
2. **시드 = `assets/logo-base.png` 직접**(재추출하지 않는다). `.design/logo/assets/seed.png`로 복사하거나 경로를 그대로 시드로 쓴다. 보여주고 "이 마크 맞아요?" 확인.
   - **단일 커밋 옵션**: 사용자가 `logo-base`를 그대로 확정할 수 있다(탐색은 opt-in).
3. `logo-briefs.md` 작성(시드 출처·발산 방향·제약).
4. **승인 게이트 (생성 전 필수)**: 시드 + brief를 제시하고 방향 확인. 승인 전엔 이미지를 한 장도 생성하지 않는다.

### Phase 2 — 탐색 시트 → 단독 로고 확정

**탐색은 opt-in.** `logo-base`가 만족스러우면 탐색을 건너뛰고 바로 단독 확정(8)→로고 시스템(Phase 3)으로 간다. "다른 방향도 보고 싶다"일 때만 탐색을 시작한다.

5. **발산 모드 선택**: A(기준·logo-base 앵커) / B(제로베이스 완전 발산·미첨부) / C(첨부 이미지 앵커). 라운드마다 다시 고를 수 있다. (Phase 0 최소 Q&A 경로는 B 고정.)
6. **발산 라운드 생성**: 컨셉 3~4개를 `references/logo-sheet-html-direction.md` §8 청크로 **병렬 백그라운드** 생성(`gpt-image-1.5 --background transparent --autocrop --quality low`) → `assets/concepts/round-N/01..04.png`. `logos.html`을 저작해 번호·방향 라벨·베이스라인 타일(#0)로 보여준다. 처음 제시 시 라이브 서버 1회 기동.
7. **수정 루프**:
   - **"다시, 더 다르게"** → 발산 라운드 재생성(모드 재선택 가능), `logos.html` **교체**.
   - **"#N 좋다"** → 사용자에게 묻는다: **(a) 수렴 라운드** — 그 PNG를 `--image --input-fidelity high`로 첨부해 같은 방향 3~4 변주를 만들고 시트 교체(반복 가능), 또는 **(b) 바로 단독 확정**.
8. **단독 로고**: 고른 PNG는 이미 투명 단독 컷아웃이므로 **재추출 없이** `assets/logo-candidate.png`로 승격한다. 더 다듬고 싶으면 그 PNG를 `--image --input-fidelity high`로 첨부해 "중앙 정렬, 형태·기하 유지, 단일 마크만"으로 다듬는다(`logo-art-direction.md` §7 품질 프레이밍, §8 품질 테스트로 자가 판정).
9. **다듬기 루프**: 직전 후보를 `--image --input-fidelity high`로 첨부해 한 번에 한 가지만 증분 편집(나머지 보존), `--auto-version`. lock까지.
10. **확정(복사)**: 확정본을 `.design/final/logo/assets/logo.png`로 복사. 시안은 `.design/logo/assets/`에 보존.

### Phase 3 — (선택) 로고 시스템

11. logo.png lock 후 "워드마크 / 파비콘 / 앱 아이콘도 만들까요?"라고 제안한다. 원하는 것만, **확정 logo.png를 `--image`로 첨부**(wordmark·favicon는 gpt-image-1.5라 `--input-fidelity high`로 마크에 묶음; app-icon은 gpt-image-2라 미사용)해 한 개씩 생성→보여줌→다듬기→lock:
    - **wordmark**: "<제품명>을 BRAND_KIT §8 타입 방향으로 워드마크화, 심볼+워드마크 락업 또는 워드마크 단독, plain 단색 배경" → `wordmark.png`.
    - **favicon**: "이 마크를 16/24/32px에서 읽히게 단순화, 단색, 정사각, plain 단색 배경" → `favicon.png`.
    - **app-icon**: "이 마크를 라운드 사각 앱 아이콘 타일에 배치, 브랜드 컬러 배경, iOS/Android 앱 아이콘 스타일, 넉넉한 패딩" → `app-icon.png`(gpt-image-2 불투명).
    - 각 확정본을 `final/logo/assets/`로 복사, `logo-briefs.md`에 로고 시스템 스펙을 기록.
12. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**. 라이브 프리뷰 서버가 떠 있으면 종료한다.

## 품질 기준 / 금지 사항

- 시트의 3~4개는 **또렷이 구별되는 큰 방향**이어야 한다 — 미세 변주 반복 금지. 레이아웃·카드 규칙은 `references/logo-sheet-html-direction.md`.
- 단독 로고는 `../references/design/logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미)를 통과해야 한다.
- 로고 마크·워드마크·파비콘 배경은 투명(gpt-image-1.5 `--background transparent --autocrop`). 앱 아이콘은 gpt-image-2 불투명 컬러 타일.
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 있는 로고, 카드마다 스타일 난립, 시트에 가짜 본문 텍스트, 유명 마크 모방 (§6·§9).
- 한글 워드마크는 짧고 단순하게, 정확한 문구의 권위 원본은 `BRAND_KIT.md`.
