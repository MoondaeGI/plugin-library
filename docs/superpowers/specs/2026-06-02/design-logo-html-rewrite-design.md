# design-logo HTML 재작성 설계

## 배경 / 문제

현재 `design-logo`는 **40개 컨셉을 한 장에 담은 정사각 그리드 이미지**(`exploration-board.png`)를 `gpt-image-2`로 생성하고, 보드를 통째로 재렌더하며 좁혀간다. 실사용에서 드러난 문제:

- 40칸은 **중복·불필요한 마크가 많다** — 한 형태의 미세 변주가 반복됨.
- 그리드 합성 이미지라 각 셀이 **깨끗한 컷아웃이 아니다** — 고른 컨셉을 단독 로고로 쓰려면 보드 셀에서 재추출해야 하고, 그 과정이 드리프트를 만든다.
- 자매 스킬 `design-brand-kit`은 이미 **개별 투명 PNG 자산 + 저작한 HTML 오버뷰(`overview.html`)** 모델로 이동했다. `design-logo`만 보드 이미지 모델에 남아 일관성이 없다.

## 목표

`design-logo`를 다음 모델로 **재작성**한다:

1. 한 라운드에 **3~4개**의 큰 방향(메타포까지 갈라진 발산)만 만든다.
2. 각 컨셉은 **개별 투명 PNG 컷아웃**(`gpt-image-1.5 --background transparent --autocrop`)으로 생성한다.
3. 그것들을 **저작한 `logos.html` 탐색 시트**(번호·방향 라벨, 실색·실폰트)에 그리드로 배치해 보여준다 — `overview.html`과 같은 저작 방식.
4. 기존의 **"#N 선택 → 수렴 → 재생성"** 루프를 유지하되, 발산/수렴 두 종류 라운드가 같은 시트를 **교체**하며 돈다.
5. 고른 PNG는 이미 깨끗한 컷아웃이므로 **보드 셀 재추출 단계를 제거**한다.

비목표: 로고 시스템(wordmark·favicon·app-icon)은 만들지 않는다(현재 불필요 — 확정 단일 로고만). `logo-art-direction.md`(§1–9 형태 언어·품질 테스트)·brand-kit 업스트림 산출물 구조는 바꾸지 않는다.

## 핵심 결정

### 1. 렌더 모델 — 개별 투명 PNG + 저작 HTML 시트

- 40칸 그리드 이미지(`gpt-image-2`)를 **버린다**. 컨셉마다 `--model gpt-image-1.5 --background transparent --autocrop`로 투명 컷아웃 PNG 1장씩 생성(brand-kit `logo-base`와 동일 라우팅).
- 한 라운드 3~4개는 **병렬 백그라운드 호출**로 생성(순차는 느림). 다듬기 루프는 순차.
- `logos.html`은 생성기가 아니라 **LLM이 저작**한다 — `<img>` 상대경로, 데이터(브랜드명·태그라인)는 `BRAND_KIT.md`/tokens에서, 폰트는 `font-catalog.md`의 실폰트 CDN `<link>`, 색은 `brand-tokens.json` 실값.

### 2. 라운드 = 교체 (누적 아님)

- `logos.html`은 **항상 현재 라운드 3~4개만** 보여준다.
- 이전 라운드 PNG는 `.design/logo/assets/concepts/round-N/`에 `--auto-version`으로 남는다(롤백은 git). 시트 자체는 매 라운드 재저작(또는 외과 편집)되어 현재 라운드를 가리킨다.

### 3. 발산 폭 = 메타포까지 완전 발산

- 발산 라운드의 3~4개는 **핵심 메타포·심볼 자체가 다른** 큰 스윙이다(추상 기하 vs 구체 상징 vs 레터마크 등). 브랜드 **성격·금지·색**만 공유한다.
- 각 컨셉은 `logo-art-direction.md`의 다른 컨셉 방법(§2)/유형(§4)을 대표한다 — "한 브랜드의 3~4가지 해석".

### 4. 발산 모드 선택 (A / B / C)

탐색 시작 시 발산 앵커를 사용자가 고른다. **라운드마다 다시 고를 수 있다**(예: A로 시작 → "더 멀리" → B).

| 모드 | 앵커 | `--image` | 특성 |
|---|---|---|---|
| **A 기준 발산** | `logo-base.png` | 첨부 | 그 마크 계열 변주 위주. 브랜드 일관성 강함, 다양성 좁음. |
| **B 제로베이스 완전 발산** | 없음(텍스트→이미지) | 미첨부 | `BRAND_KIT.md` §6·메타포·색·금지·성격을 프롬프트에. 다양성 최대. |
| **C 첨부 이미지 기준** | 사용자 첨부 이미지 | 첨부 | 사용자가 준 레퍼런스를 앵커로. |

- **근거**: 컷아웃은 `gpt-image-1.5`로 만드는데, `image-gen`이 `input_fidelity`를 보내지 않으면 입력 이미지를 **기본(low)으로 느슨하게** 참조한다. 그래서 모드 A·C(앵커 첨부)는 `--input-fidelity high`를 함께 줘야 마크에 단단히 묶인다(아래 결정 7). "메타포까지 완전 발산"을 원하면 시드를 **붙이지 않는** B가 맞다. 모드 A에서 변주 폭이 좁아지는 건 **의도된 트레이드오프**.
- 어느 모드든 `logo-base.png`는 시트에 **베이스라인 타일(#0 "brand-kit 기준")**로 고정해 비교·즉시 선택 가능.

### 5. 수렴은 항상 앵커 첨부

- `#N` 선택 시 그 PNG를 `--image --input-fidelity high`로 첨부 + "이 방향을 유지하며 3~4 변주". high fidelity가 방향에 단단히 묶는다(결정 7).
- 단독 다듬기 루프("한 가지만 바꾸고 나머지 보존")도 `--image --input-fidelity high`로 보존을 확보한다.
- `#N` 선택 직후 사용자에게 묻는다: **(a) 수렴 라운드 한 번 더** vs **(b) 바로 단독 확정**.

### 7. image-gen `--input-fidelity` 복원 (선행 작업)

- `image-gen.mjs`는 과거 `--input-fidelity`를 지원했으나(`a65eaf5`), gpt-image-2가 미지원이라는 이유로 **일괄 제거**됐다 — gpt-image-1.x에서 유용하던 옵션까지 죽었다. 본 재작성의 모드 A·C·수렴·다듬기는 전부 gpt-image-1.5 컷아웃이라 이 옵션이 **반드시 필요**하다.
- **복원(모델 게이트)**: `--input-fidelity <high|low>`를 되살리되, `input_fidelity`는 **`gpt-image-1`로 시작하는 모델 + `--image`(edits)**일 때만 페이로드에 넣는다. **gpt-image-2에는 절대 보내지 않는다**(거부됨 — 항상 high로 처리). gpt-image-2에 플래그가 와도 조용히 드롭(stderr 1줄 통지).
- 기존 회귀 가드 테스트("제거되어 거부됨")는 **뒤집어** 갱신한다 — 옵션이 동작하고, gpt-image-2에선 페이로드에서 빠지는 것을 검증.
- 이는 공유 스크립트 변경이므로 design-logo 도큐먼트(결정 4·5)보다 **먼저** 처리한다.

### 6. 보드 셀 재추출 제거

- 고른 `#N`은 이미 깨끗한 투명 단독 컷아웃이므로, 만족스러우면 **재추출 없이** 그 PNG를 `assets/logo-candidate.png`로 승격 → 다듬기 → `final/logo/assets/logo.png`로 lock.

## 흐름 (디자이너 협업 루프)

```
Phase 0 — 입력 감지
 ├─ brand-kit(BRAND_KIT.md + logo-base.png) 없음
 │    → "design-brand-kit으로 브랜드 킷부터 만들까요? (권장)"
 │       ├─ 예    → design-brand-kit 안내 후 종료
 │       └─ 아니오 → 로고용 최소 Q&A(제품명·분야·성격·메타포·색·금지)
 │                   → 시드 없이 텍스트→이미지 = 발산 모드 B 고정
 │                   → logo-briefs.md에 Q&A 기록, 끝에 brand-kit 안내
 ├─ 사용자 첨부 이미지 있음 → seed-user.png로 저장 + 역할 질문
 │       ├─ "이 방향으로 발산" → Phase 2 발산 모드 C
 │       └─ "이걸 다듬자/확정"  → Phase 2 단독 다듬기 루프 직행
 └─ brand-kit 있음 → Phase 1

Phase 1 — 시드 + 승인 게이트
 - logo-base.png 그대로 베이스라인 시드. brief 작성, 방향 확인.
 - "logo-base 그대로 확정" 단일 커밋 옵션 유지 (탐색은 opt-in).
 - 승인 전 이미지 0콜.

Phase 2 — 발산/수렴 루프
 - 발산 모드 선택: A(기준) / B(제로베이스) / C(첨부 이미지)
 - 3~4개 개별 투명 PNG 병렬 생성 → logos.html 시트로 제시
   (번호·방향 라벨, logo-base 베이스라인 타일 #0 고정, 실색·실폰트)
 - "다시, 더 다르게" → 발산 라운드 재생성(시트 교체, 모드 재선택 가능)
 - "#N 좋다" → 질문:
     (a) 수렴 라운드 → #N 앵커로 3~4 변주(시트 교체, 반복 가능)
     (b) 바로 단독 확정
 - 단독 로고 다듬기 루프(한 번에 한 가지 증분 편집) → lock(.design/final/logo/assets/logo.png)
 - 끝에 "다음 단계: design-iconset" 안내.

(로고 시스템 wordmark·favicon·app-icon은 만들지 않는다 — 현재 불필요. 확정 단일 로고만 산출.)
```

## 파일 구조 (대상 프로젝트 cwd 기준)

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
    assets/  logo.png   # lock (확정 단일 로고)
```

- `logos.html`의 모든 `<img>`는 형제 `assets/` 상대경로(`assets/concepts/round-N/01.png`·`assets/seed.png`) → `.design/logo/`든 복사본이든 동일 동작. brand-kit(`.design/brand-kit/` + `assets/`)과 동형.
- 탐색 시트(`logos.html`)는 **작업 산출물** — final로 잠그지 않는다. `final/logo/assets/`는 확정 단일 로고 + (선택) 시스템.
- `--auto-version`은 해당 폴더 안에서 누적. 롤백은 git.

## `logos.html` 레이아웃 (저작 가드레일)

- brand-kit의 A/B/C/D 아키타입을 쓰지 **않는다** — 목적이 다른 **전용 탐색 시트**(마크 비교 갤러리).
- **번호 카드 그리드**: 각 카드 = 투명 로고 PNG(충분히 크게, autocrop으로 캔버스를 꽉 채움) + 인덱스 번호(`01`–`04`) + 한 줄 방향 라벨 + 컨셉 방법/유형 태그.
- `logo-base.png` = **베이스라인 타일(#0 "brand-kit 기준")** 고정.
- 헤더: 브랜드명 + "LOGO EXPLORATION" + 라운드·발산 모드 라벨. 푸터: 태그라인.
- 캔버스 라이트/다크는 브랜드 비주얼 모드. 실색(`brand-tokens.json`)·실폰트(`font-catalog.md` CDN `<link>`).
- 콘텐츠(브랜드명·태그라인·라벨)는 지어내지 않는다 — 라벨은 그 라운드에서 실제로 만든 컨셉 방향을 가리킨다.

## 라이브 프리뷰

- `logos.html`을 **처음 제시할 때** 공유 런처로 로컬 라이브 서버를 **1회 백그라운드** 기동(이후 PNG 재생성·HTML 편집 시 자동 새로고침). brand-kit과 동일.
  ```
  node ../../scripts/lib/serve-design.mjs <cwd>/.design/logo
  ```
- 명령 실행이므로 최초 1회 사용자 확인. lock 후/세션 종료 시 서버 종료.

## 변경 대상 파일

| 파일 | 변경 |
|---|---|
| `skills/image-gen/scripts/image-gen.mjs` | `--input-fidelity <high|low>` 복원(모델 게이트 — gpt-image-1.x + edits일 때만 페이로드, gpt-image-2 제외). 결정 7. |
| `tests/image-gen-image-input.test.mjs` | "제거되어 거부됨" 가드 2건을 동작·게이트 검증으로 뒤집기. |
| `skills/design-logo/SKILL.md` | 재작성 — 출력 파일·이미지 라우팅(`--input-fidelity high` 앵커)·흐름(Phase 0~2)·`logos.html` 저작·라이브 프리뷰 절 갱신. description의 "40개 컨셉 보드" 문구 교체. |
| `skills/design-logo/references/logo-exploration-board.md` | **제거** → `references/logo-sheet-html-direction.md`로 대체(시트 저작 가이드: 레이아웃·카드·라벨·발산 모드 스티어·금지). |
| `skills/design-logo/references/logo-sheet-html-direction.md`(신규) | 신설. fidelity 서술은 `--input-fidelity high` 기준으로(결정 4·5). |

- 변경 후 `npm run sync`로 Codex 번들·codex-agents 재생성(소스만 커밋, 생성물은 gitignore).
- 공유 ref `../references/design/logo-art-direction.md`(§1–9)는 그대로 사용 — 형태 언어·품질 테스트·Avoid는 시트 저작·단독 로고 양쪽에서 인용.

## 품질 기준 / 금지

- 시트의 3~4개는 **또렷이 구별되는 큰 방향**이어야 한다 — 미세 변주 반복 금지.
- 단독 로고는 `logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미) 통과.
- 컷아웃 배경 투명(`gpt-image-1.5 --background transparent --autocrop`).
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 로고, 카드마다 스타일 난립, 유명 마크 모방. 시트에 가짜 본문 텍스트·읽히지 않는 미세 디테일 금지.
```