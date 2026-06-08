---
name: design-logo
description: brand-kit의 로고 이미지가 마음에 들지 않거나 단순히 프로젝트 로고를 만들 때 쓰는 온디맨드 단계. 확정된 brand kit를 바탕으로 로고를 탐색·확정한다. assets/brand-kit/logo-base.png(투명)를 시드로, 한 라운드에 3~4개 방향을 개별 투명 PNG로 만들어 logos.html 탐색 시트(번호·라벨·실색·실폰트)로 보여주고, #N을 골라 수렴 라운드 또는 단독 확정으로 좁혀 assets/logo/에 확정한다.
---

# Design Logo

당신은 확정된 브랜드 킷에서 출발해 실제로 쓸 수 있는 로고를 좁혀가는 아이덴티티 디자이너다.

## 목적

이 단계는 **온디맨드**다 — brand-kit이 만든 `logo-base.png`가 만족스러우면 건너뛴다. brand-kit 로고가 아쉽거나 별도 프로젝트 로고가 필요할 때만 탐색한다.

> **선택성 등급**: **logo-skip = 단일 마크 한정 충분**(`logo-base.png`가 단일 컷아웃 마크를 대체 — 락업·변형 같은 로고 *시스템*은 없음). 이는 `design-iconset` 건너뛰기(core 아이콘 없으면 ui-kit이 유니코드로 degrade)와 달리 단일 마크 용도엔 무손실이다.

> **파이프라인 비대칭(의도):** 로고는 확정 시 캐노니컬 파일 `assets/logo/logo.png`를 **덮어써** overview의 base를 교체한다(흐름 10, HTML 무수정). 반면 아이콘은 컨셉 PNG(브랜드 전시)와 확정 SVG(제품)가 overview §11에 **병존**한다(`design-iconset` 역할 분리). 이 비대칭은 빠뜨린 게 아니라 의도다.

`design-brand-kit`이 확정된 뒤 사용한다. 보드의 "로고 방향"은 한 칸짜리 제시일 뿐이라, 여기서 **브랜딩 스튜디오의 로고 탐색**처럼 한 라운드에 **3~4개의 큰 방향**(메타포까지 갈라진 발산)을 개별 투명 PNG로 만들어 저작한 **`logos.html` 탐색 시트**(번호·방향 라벨·실색·실폰트)로 보여준다. 사용자가 `#N`을 고르면 그 방향으로 **수렴 라운드**(3~4 변주)를 더 돌거나 **바로 단독 확정**한다. 고른 PNG는 이미 깨끗한 컷아웃이라 보드 셀 재추출이 없다. 확정 단일 로고를 `.design/assets/logo/`에 확정한다(워드마크·파비콘 등 로고 시스템은 만들지 않는다). 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다. 형태 언어·컨셉 방법·품질 테스트는 `../references/design/logo-art-direction.md`, 시트 저작은 `references/logo-sheet-html-direction.md`를 따른다.

## 전제

- `design-brand-kit` 산출물(`.design/assets/brand-kit/logo-base.png` · `.design/BRAND_KIT.md` · `.design/brand-tokens.json`)이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 로고용 최소 Q&A).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패).
- `logos.html`은 이미지가 아니라 `references/logo-sheet-html-direction.md`를 가드레일로 **LLM이 저작**한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/assets/brand-kit/logo-base.png` — **확정 로고 마크 시드(투명).** 모드 A·베이스라인 타일 시드.
- `.design/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴.
- `.design/brand-tokens.json` — 색 HEX·타이포(시트 실색·실폰트).

> `logo-base.png`가 **없으면** Phase 0에서 brand-kit 안내 또는 로고 Q&A로 진행한다(아래 흐름).

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  view/
    logos.html                       # 현재 라운드 시트 (교체, ../candidate/logo/ 상대경로 <img>)
  candidate/
    logo/
      logo-briefs.md                 # 시드 출처·발산 모드·라운드 로그·확정 컨셉
      logo-prompt.txt                # 확정 로고 최종 프롬프트 (favicon 생성 분기 재료)
      seed.png                       # logo-base 복사/참조 (모드 A·C 앵커)
      seed-user.png                  # (선택) 사용자 첨부 이미지
      concepts/round-N/01..04.png    # 라운드별 개별 투명 PNG (--auto-version)
      logo-candidate.png (+v2…)      # 고른 #N 단독 다듬기
      favicon-candidate.png (+v2…)   # favicon 생성 시안(접근 C 프리뷰 게이트)
      logo-dark-candidate.png (+v2…) # 다크 변형 시안(프리뷰 게이트)
  assets/
    logo/  logo.png                  # 확정 심볼 (풍부한 마크)
           favicon.png               # favicon/app-icon 마크 (레터마크/단순=autocrop 재사용, 그 외=접근 C 생성)
           logo-dark.png             # 다크모드 변형 (remap-logo-dark 또는 생성 폴백)
```

- `logos.html`(view/)의 모든 `<img>`는 `../candidate/logo/concepts/round-N/01.png`·`../candidate/logo/seed.png` 상대경로.
- 탐색 시트·시안은 `candidate/logo/`에 `--auto-version`으로 누적. 확정 단일 로고는 `assets/logo/logo.png`에 **덮어쓴다** — `view/overview.html` §6이 이 경로를 직접 가리키므로 HTML 편집 없이 라이브 새로고침으로 반영된다(아래 흐름 10).

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 로고 마크는 `gpt-image-1.5 --background transparent`(투명 PNG). **제시용 로고는 autocrop 옵션을 쓰지 않는다**(여백 유지 — favicon급 꽉참 금지). 작은 축소 마크·favicon은 별도(스펙 B).
- **개별 PNG, 그리드 아님**: 40칸 그리드 합성은 더 안 쓴다. 컨셉마다 단독 마크 PNG 1장씩 생성한다.
- **한 라운드 3~4콜 = 병렬 백그라운드**: 서로 다른 컨셉은 `image-gen`을 동시(백그라운드) 호출해 병렬 생성(순차는 느림). 다듬기 루프는 순차.
- **충실도**: 컷아웃은 `gpt-image-1.5`다. 앵커(모드 A·C·수렴·다듬기)는 `--image --input-fidelity high`로 첨부해야 입력 마크에 단단히 묶인다(미지정이면 기본 low로 느슨하게 참조). 발산 모드 B는 미첨부(완전 발산). "보존이냐 새로냐"는 **시드 첨부 여부 + input-fidelity**로 표현한다.
- **품질**: 제시용 로고는 `--quality high`로 굽는다(과거 `low`가 유치함의 원인 중 하나였다). 발산·다듬기 모두 high.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 컷아웃 청크는 `references/logo-sheet-html-direction.md` §8, 단독 로고 품질 프레이밍은 `../references/design/logo-art-direction.md` §7.
- 호출 예(발산 컨셉 1개 — 모드 B, 시드 미첨부):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --out "<cwd>/.design/candidate/logo/concepts/round-1/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --quality high
  ```
- 호출 예(모드 A/C·수렴 — 앵커 첨부, **high fidelity로 묶음**):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --image "<cwd>/.design/candidate/logo/seed.png" --input-fidelity high \
    --out "<cwd>/.design/candidate/logo/concepts/round-2/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --quality high
  ```

### logos.html 저작 (이미지 아님)

`logos.html`은 생성기로 만들지 않는다 — `references/logo-sheet-html-direction.md`의 레이아웃 규칙을 가드레일로 **LLM이 저작**한다: 자산은 `<img>`(`../candidate/logo/` 상대경로), 브랜드명·태그라인은 `.design/BRAND_KIT.md`에서, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`. 카드 라벨은 그 라운드에서 실제 만든 컨셉 방향을 가리킨다(지어내지 않음). `logo-base.png`는 베이스라인 타일(#0)로 고정.

**토큰은 tokens.css로 소비:** brand-kit이 있으면 head에 `<link rel="stylesheet" href="../assets/tokens.css">`(`view/` 깊이 상대경로)를 넣고, 시트의 색·폰트·radius를 **실 HEX·실 px 인라인 대신 `var(--token)`**(`--color-*`·`--font-*`·`--radius-*`)으로 렌더한다(실값은 tokens.css가 보유 — 전사 드리프트 방지). tokens.css는 brand-kit lock이 생성하며, 부재 시(로고용 최소 Q&A 경로) var() 폴백값 또는 `brand-tokens.json` 실값을 인라인한다.

### 라이브 프리뷰 (자동 새로고침)

`logos.html`을 **처음 제시할 때** 공유 런처로 로컬 라이브 서버를 **한 번 백그라운드로** 띄운다 — 이후 PNG 재생성·HTML 편집 때마다 자동 새로고침.

```
node ../../scripts/lib/serve-design.mjs <cwd>/.design
```

시트 직접 URL: `http://localhost:5500/view/logos.html`

- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동. lock 후/세션 종료 시 서버를 종료한다(포트 점유 방지).

## 흐름 (디자이너 협업 루프)

### Phase 0 — 입력 감지 (시작 시 필수)

- `.design/BRAND_KIT.md`와 `.design/assets/brand-kit/logo-base.png` 존재, 그리고 **사용자 첨부 이미지** 유무를 확인한다.
- **사용자 첨부 이미지가 있으면** → `.design/candidate/logo/seed-user.png`로 저장하고 **역할을 묻는다**:
  - **"이 방향으로 발산"** → Phase 2 발산 모드 C(그 이미지를 앵커로; brand-kit이 있으면 tokens·BRAND_KIT.md도 함께 읽어 시트 실색·실폰트·베이스라인에 쓴다).
  - **"이걸 다듬자/확정"** → Phase 2 단독 다듬기 루프로 직행(그 이미지를 시드로).
- **brand-kit이 있으면** → Phase 1.
- **brand-kit이 없으면** → 묻는다: "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·타이포·보이스까지 갖춰 마크 근거가 탄탄)".
  - **예** → design-brand-kit을 안내하고 종료.
  - **아니오** → **로고용 최소 Q&A**(한 번에 하나씩): 제품명·한 줄 소개 / 분야 / 브랜드 성격·톤 / 핵심 메타포·심볼 방향 / 색(HEX 또는 방향) / 피할 클리셰. 추측 금지. 수집분을 `logo-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). 이 경우 Phase 2는 **발산 모드 B 고정**(시드 미첨부, 텍스트→이미지). 끝에 "더 완전한 시스템이 필요하면 design-brand-kit"을 안내.

### Phase 1 — 시드 + 승인 게이트 (brand kit가 있을 때)

1. 입력 읽기(`BRAND_KIT.md` §6·tokens·assets/brand-kit/logo-base.png).
2. **시드 = `assets/brand-kit/logo-base.png` 직접**(재추출하지 않는다). `.design/candidate/logo/seed.png`로 복사하거나 경로를 그대로 시드로 쓴다. 보여주고 "이 마크 맞아요?" 확인.
   - **단일 커밋 옵션**: 사용자가 `logo-base`를 그대로 확정할 수 있다(탐색은 opt-in).
3. `candidate/logo/logo-briefs.md` 작성(시드 출처·발산 방향·제약).
4. **승인 게이트 (생성 전 필수)**: 시드 + brief를 제시하고 방향 확인. 승인 전엔 이미지를 한 장도 생성하지 않는다.

### Phase 2 — 탐색 시트 → 단독 로고 확정

**탐색은 opt-in.** `logo-base`가 만족스러우면 탐색을 건너뛰고 바로 단독 확정(8)·복사(10)로 간다. "다른 방향도 보고 싶다"일 때만 탐색을 시작한다.

5. **발산 모드 선택**: A(기준·logo-base 앵커) / B(제로베이스 완전 발산·미첨부) / C(첨부 이미지 앵커). 라운드마다 다시 고를 수 있다. (Phase 0 최소 Q&A 경로는 B 고정.)
6. **발산 라운드 생성**: 컨셉 3~4개를 `references/logo-sheet-html-direction.md` §8 청크로 **병렬 백그라운드** 생성(`gpt-image-1.5 --background transparent --quality high`, autocrop 없음) → `candidate/logo/concepts/round-N/01..04.png`. `logos.html`을 저작해 번호·방향 라벨·베이스라인 타일(#0)로 보여준다. 처음 제시 시 라이브 서버 1회 기동.
7. **수정 루프**:
   - **"다시, 더 다르게"** → 발산 라운드 재생성(모드 재선택 가능), `logos.html` **교체**.
   - **"#N 좋다"** → 사용자에게 묻는다: **(a) 수렴 라운드** — 그 PNG를 `--image --input-fidelity high`로 첨부해 같은 방향 3~4 변주를 만들고 시트 교체(반복 가능), 또는 **(b) 바로 단독 확정**.
- **락업 프리뷰 게이트(신규, 스펙 B-🅰)**: 심볼을 lock하기 전, 확정 심볼 + 워드마크를 `.lockup`(가로·세로)으로 `logos.html`에 렌더한다. 에이전트가 그 결과를 `web-publisher-qa`로 스크린샷해 균형을 자가판정하고, 어색하면 brand-tokens.json `lockup.markScale`/`gap`을 조정해 재렌더한 뒤 결과를 사용자에게 제시한다(사용자는 "좋다/심볼 더 크게" 같은 평이한 승인만 — 수치 직접 편집 없음). 마크는 심볼이며 워드마크는 굽지 않는다.
8. **단독 로고**: 고른 PNG는 이미 투명 단독 컷아웃이므로 **재추출 없이** `candidate/logo/logo-candidate.png`로 승격한다. 더 다듬고 싶으면 그 PNG를 `--image --input-fidelity high`로 첨부해 "중앙 정렬, 형태·기하 유지, 단일 마크만"으로 다듬는다(`logo-art-direction.md` §7 품질 프레이밍, §8 품질 테스트로 자가 판정).
9. **다듬기 루프**: 직전 후보를 `--image --input-fidelity high`로 첨부해 한 번에 한 가지만 증분 편집(나머지 보존), `--auto-version`. lock까지.
10. **확정(덮어쓰기 — HTML 무수정)**: 확정본을 `.design/assets/logo/logo.png`에 **덮어쓴다**(brand-kit이 시드해 둔 base 복사본을 교체). 시안은 `candidate/logo/`에 보존. `view/overview.html` §6의 로고 자리(심볼·락업 심볼·앱아이콘·파비콘)가 이미 `../assets/logo/logo.png`를 가리키므로 **HTML을 편집하지 않는다** — 라이브 서버가 파일 교체를 감지해 자동 새로고침한다. 시드 `assets/brand-kit/logo-base.png`는 불변이다(작업 시드는 `candidate/logo/seed.png`에 이미 복사됨). `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록한다 — 이 파일은 brand-kit의 non-clobber 표식이자 md-compiler의 출처 표식이다(design-brand-kit 흐름 8·design-md-compiler §12). 또한 확정 로고를 생성한 **최종 프롬프트를 `candidate/logo/logo-prompt.txt`에 저장**한다(흐름 11 favicon 생성 분기의 의미 가이드 재료 — 재사용 분기면 불필요).
11. **favicon/app-icon 마크(스펙 §4 — PNG, 로고 맥락)**: 심볼 lock 직후 — 확정 `logo.png`로 favicon을 만든다. ⓐ **유형 판정**: 레터마크이거나 이미 16px에 읽히는 단순 심볼이면 **재사용** — `node "<이 스킬 디렉터리>/../image-gen/scripts/autocrop.mjs" --in <.design>/assets/logo/logo.png --out <.design>/assets/logo/favicon.png --pad-pct 6`(생성 0). ⓑ 그 외(픽토리얼·엠블럼·콤비네이션·복잡 심볼·워드마크)면 **생성(접근 C)** — `candidate/logo/logo-prompt.txt`(흐름 10 저장본, 없으면 `logo-briefs.md`·`BRAND_KIT.md §6`에서 모티프·실 HEX 재구성)에 favicon 단순화 지시("single bold flat mark of the core motif only, drop text/frame/fine detail, legible at 16px, transparent")를 더해 프롬프트 파일을 쓰고, `--image <.design>/assets/logo/logo.png --input-fidelity high --model gpt-image-1.5 --background transparent --quality high --autocrop`로 `candidate/logo/favicon-candidate.png`를 생성(`--auto-version`). ⓒ **프리뷰 게이트**: `logos.html` favicon 프리뷰 섹션에 16/24/32/48px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 사용자에게 제시(평이한 승인만). ⓓ 승인 후 `assets/logo/favicon.png`로 lock. **app-icon은 같은 마크** — overview §6에서 `favicon.png`를 브랜드색 라운드 타일에 얹어 CSS 프리뷰(별도 파일 없음). **HTML은 편집하지 않는다**(overview §6·`<head>`가 `favicon.png`를 가리킴).
12. **다크모드 변형(스펙 B-🅱-i)**: 큰 풀로고의 다크모드용 변형을 **결정론 리맵**으로 만든다 — ⓐ 라이트 `logo.png`의 소스색(= 로고에 쓰인 brand-tokens 색)과 각 색의 **다크 타깃**(브랜드 다크 팔레트)을 `#SRC:#DST` 매핑으로 구성한다. ⓑ `node scripts/remap-logo-dark.mjs --in <.design>/assets/logo/logo.png --out <.design>/candidate/logo/logo-dark-candidate.png --map "#SRC:#DST" …`(색마다 --map). OKLab·엣지 보간은 스크립트가 처리. ⓒ **프리뷰 게이트**: **큰 사이즈**로 다크 배경(+ 라이트 원본 나란히)에 렌더하고 **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독·정체성 자가판정 → 부족하면 매핑 조정·재리맵 → 사용자에게 제시(평이한 승인만). ⓓ 승인 → `assets/logo/logo-dark.png` lock, 매핑을 `candidate/logo/logo-briefs.md`에 기록(재현성). **HTML 무편집**. ⓔ **생성 폴백**: 다크에서 구조 재설계(배지 채움 제거·아웃라인 추가 등)가 필요해 리맵으론 룩이 안 살면, `logo.png`를 첨부(`--image --input-fidelity high`)해 "다크 배경용 재설계, 구성·정체성 유지"로 생성한다(색 hex는 부정확함을 감수).
13. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-iconset`"**. 라이브 프리뷰 서버가 떠 있으면 종료한다.

> 워드마크는 이 스킬에서 굽지 않는다 — 락업에서 `.wordmark`로 별도 조합한다(스펙 B-🅰). 파비콘·앱 아이콘은 흐름 11에서 `favicon.png`로 만든다 — 레터마크/단순 심볼은 로고 autocrop 재사용, 그 외는 로고를 `--image`로 주입해 단순화 생성(접근 C). app-icon은 같은 마크(overview CSS 타일). 풀로고 다크 변형은 흐름 12에서 `remap-logo-dark.mjs`로 리맵한다(스펙 B-🅱-i). 확정 심볼 + favicon/app-icon 마크 + 다크 변형을 산출한다.

## 품질 기준 / 금지 사항

- **심볼-only**: `logo.png`는 심볼이다(워드마크 안 구움). 워드마크 결합은 `.lockup`이 담당(스펙 B-🅰).
- **favicon/app-icon(스펙 §4)**: `favicon.png`는 16px에 읽히는 마크다 — 레터마크/단순 심볼은 `logo.png`를 autocrop해 재사용, 그 외는 `logo.png`를 `--image`로 주입 + 캐싱 로고 프롬프트로 단순화 생성(접근 C, gpt-image-1.5). app-icon은 같은 마크(overview에서 브랜드 타일 위 CSS 프리뷰 — 별도 파일 없음). 손편집·맥락 없는 생성 금지(로고가 진실, favicon은 그 함수). 풍부한 다색 풀로고의 다크 변형은 흐름 12(🅱-i 결정론 리맵) 참조.
- **다크 변형(스펙 B-🅱-i)**: 큰 풀로고 다크모드는 `remap-logo-dark.mjs`로 라이트 로고에서 결정론 리맵(브랜드 다크 hex·OKLab·엣지 보간)한다 — 정확·재현·무비용. 손편집·임의 생성 금지(라이트가 진실, 다크는 그 함수). 구조 재설계가 필요한 로고만 생성 폴백.
- 시트의 3~4개는 **또렷이 구별되는 큰 방향**이어야 한다 — 미세 변주 반복 금지. 레이아웃·카드 규칙은 `references/logo-sheet-html-direction.md`.
- 단독 로고는 `../references/design/logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미)를 통과해야 한다.
- 로고 마크 배경은 투명(gpt-image-1.5 `--background transparent`, autocrop 없음).
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 있는 로고, 카드마다 스타일 난립, 시트에 가짜 본문 텍스트, 유명 마크 모방 (§6·§9).
