# design-brand-kit 시각 승인 게이트 + 컨택트 시트 발산 (설계)

날짜: 2026-06-01
대상 스킬: `skills/design-brand-kit/`

## 문제

`design-brand-kit`의 목적은 **"디자인을 하나도 몰라도 그냥저냥 괜찮은 브랜드를 뽑아내는 것"**이다. 그런데 현재 흐름 3의 승인 게이트는 `BRAND_KIT.md`·`brand-tokens.json`·`brief.md` 산문(텍스트)을 제시한다. 디자인을 모르는 대상 사용자는 폰트(이름+specimen URL)·색·무드를 **글자로는 판단할 수 없어** 게이트가 사실상 도장만 찍는 절차가 된다. 게이트가 의도한 사용자에게 신호를 주지 못한다.

또한 분위기가 열렸을 때의 발산은 `routes/route-{a,b,c}/`에 **풀 킷 3벌**을 짓고 풀 `overview.html` 3장을 비교한다. 이는 (1) 늦고, (2) 풀 킷을 산문으로 동시에 쓰면 모델이 가운데로 수렴해 세 방향이 별로 안 달라 보이며, (3) 풀 overview 3장은 90%가 같은 레이아웃이라 차이(색·폰트)가 묻힌다. 게이트 전에 route당 이미지 ~3장(×3 route)을 선소비하는 비용도 든다.

## 결정 (확정)

1. **게이트를 "글자"에서 "공짜 시각"으로.** 색(§7)·타이포(§8)·보이스(§9)·태그라인(§5)은 tokens/MD에서 이미지 0콜로 HTML 렌더된다. 그 렌더를 승인 결정 **앞으로** 당겨, 게이트는 "읽고 승인"이 아니라 "보고 승인"이 된다. 비싼 이미지 생성은 게이트 뒤로 미룬다. 키 비주얼은 게이트에 넣지 않는다(순수 데이터).
2. **게이트 아티팩트는 `overview.html` 재사용**(새 파일 없음). 이미지 슬롯(§1·§6·§10·§11)은 "확정 후 생성" 플레이스홀더로 두고 data-only로 먼저 렌더 → 승인 후 슬롯을 실자산으로 채운다.
3. **발산 = 3열 컨택트 시트.** 풀 킷을 쓰기 전, 3방향의 무드·팔레트·폰트 1쌍·태그라인만 한 화면 3열로 공짜 렌더(`directions.html`). 한 열을 고르면 **그 방향만** 풀 킷으로 전개. 3열이 동일 레이아웃이라 차이가 또렷하다.
4. **컨택트 시트는 고정 템플릿 + JSON 주입(결정적·스크립트).** `overview.html`은 브랜드별 포스터라 LLM 자유 저작이지만, 컨택트 시트는 3열이 바이트 단위로 동일해야 비교가 선명하므로 자유 저작 금지. `directions.json`을 스크립트가 템플릿에 주입.
5. **`routes/` 폴더 폐지.** 풀 킷은 고른 방향 1벌만 짓는다. 3방향 최소 데이터는 단일 `directions.json`, 비교 뷰는 `directions.html`. 안 고른 방향은 이 두 파일에 기록으로 남는다.
6. **레퍼런스 책임 분리.** HTML 저작(overview) / 발산 HTML(contact sheet) / 이미지 생성을 세 파일로 또렷이 분리(아래).

## 컨택트 시트 메커니즘 (구현 완료 — 프로토타입)

- `skills/design-brand-kit/scripts/contact-sheet.template.html` — 레이아웃·CSS 골격만. 치환 토큰 `{{TITLE}}`·`{{PRODUCT}}`·`{{FONT_LINKS}}`·`{{COLUMNS}}`.
- `skills/design-brand-kit/scripts/build-contact-sheet.mjs` — `directions.json`을 읽어 템플릿에 결정적 주입. 폰트 family→CDN 매핑(`FONT_CDN`, 카탈로그 가용 웨이트 반영, 미매핑은 Google best-effort+경고). 3개 방향 검증(필수 필드).
- 사용: `node build-contact-sheet.mjs --in <directions.json> --out <directions.html>`

`directions.json` 스키마:
```json
{ "product": "이름",
  "directions": [
    { "id":"a", "label":"안전한 라이트 SaaS형", "mood":"한 줄",
      "wordmark":"MODO", "headline":"짧은 헤드라인", "body":"본문 샘플 1~2줄",
      "tagline":"태그라인",
      "palette": { "primary":"#…","accent":"#…","background":"#…","surface":"#…","text":"#…","textMuted":"#…","border":"#…" },
      "typography": { "display":"<family+fallback 스택>", "body":"<family+fallback 스택>" } },
    { "id":"b", … }, { "id":"c", … } ] }
```
각 열은 자기 방향의 `--bg`/`--text`/`--accent`/`--display`/`--body`로 themed 렌더(워드마크·무드·헤드라인·본문·팔레트 스와치[HEX+역할]·태그라인·폰트명).

## 새 레이아웃 (`.design/` 대상 프로젝트 cwd)

```
.design/brand-kit/
  directions.json      # 열림일 때만 — 3방향 최소 데이터 (컨택트 시트 입력)
  directions.html      # 열림일 때만 — 3열 컨택트 시트 (= 발산 게이트)
  BRAND_KIT.md         # 고른 방향(또는 고정) 풀 킷 = 작업 SSOT
  brand-tokens.json
  overview.html        # data-only 렌더(이미지 슬롯 플레이스홀더) → 승인 후 슬롯 채움
  brief.md
  assets/  logo-base · wordmark-base · key-visual · ui-base · icons/<name>.png
.design/final/brand-kit/  BRAND_KIT.md · brand-tokens.json · overview.html · assets/   # lock (변경 없음)
```
- `overview.html`의 모든 `<img>`는 형제 `assets/` 상대참조(불변). `routes/` 삭제.
- 확정 = (이미 단일 작업 폴더이므로) 추가 복사 없음. lock = `.design/brand-kit/{…}` → `.design/final/brand-kit/` 순수 복사(불변).
- `--auto-version`은 `assets/` 안에서 누적(불변). 롤백은 git.

## 새 흐름

**분위기 열림:**
1. Q&A → 열림 판정 (제품 사실 오류는 Q&A에서 거름)
2. `directions.json` 작성 — 3방향 최소 데이터. 무드 스프레드 출발점은 안전 SaaS / 프리미엄 에디토리얼 / 대담 실험 아키타입을 제품 무드(Q4–6)로 구체화. 폰트는 `../references/design/font-catalog.md`에서만.
3. `build-contact-sheet.mjs`로 `directions.html` 렌더 (이미지 0콜)
4. **게이트: 컨택트 시트 제시 → 한 열 선택**
5. 고른 방향 → `.design/brand-kit/`에 풀 `BRAND_KIT.md`·`brand-tokens.json`·`brief.md` 인스턴스화 + data-only `overview.html`(이미지 슬롯 플레이스홀더). 보고 확인 / 색·폰트 미세조정.
6. 자산 생산(투명 라우팅·앵커 일관성·품질 규율은 기존대로) → `overview.html` 슬롯 채움
7. (선택) 추가 탐색 이미지
8. lock

**분위기 고정:** Q&A→고정 → `.design/brand-kit/`에 풀 킷 직행 + data-only `overview.html` → **게이트: overview.html 제시 → 승인** → 자산 생산 → 마무리 → lock. (컨택트 시트·directions 파일 없음.)

→ 게이트까지 이미지 0콜. 이미지는 방향 확정 뒤에만.

## 레퍼런스 책임 분리

| 파일 | 단일 책임 |
|---|---|
| `references/brand-kit-html-direction.md` (← `html-direction.md` rename) | overview.html 저작만 (확정 1벌, 이미지 슬롯 포함 풀 11섹션 포스터) |
| `references/brand-kit-contact-sheet.md` (신설) | directions.html 생성 책임 — 템플릿+스크립트 사용법, `directions.json` 스키마, 자유 저작 금지 규칙, 3방향 스프레드 가이드 |
| `references/brand-kit-image.md` | 이미지 자산 아트 디렉션만 — 발산 3루트 서술 **삭제** |

## 편집 지점

- **신규(완료)**: `scripts/contact-sheet.template.html`, `scripts/build-contact-sheet.mjs`
- **신규(문서)**: `references/brand-kit-contact-sheet.md`
- **rename**: `references/html-direction.md` → `references/brand-kit-html-direction.md` (내용은 overview 전용 그대로). 참조 갱신: `SKILL.md`(overview.html 저작 절), `brand-kit-image.md`(레이아웃 스펙 포인터).
- **`SKILL.md`**: 출력 레이아웃(routes/ → directions.*) · brand-tokens 폰트 노트(후보를 컨택트 시트에서 시각 제시) · brand-briefs 발산 3루트 → directions 기반 · 흐름 3·4(게이트=컨택트 시트, 단일 방향 전개) · 이미지 호출 예 routes 경로 → brand-kit 직접. 발산 *워크플로*는 SKILL.md가 소유.
- **`references/brand-kit-image.md`**: 산출물 v2(routes/ 언급 제거) · 발산 3루트 절 삭제 · 저장 경로(routes/ 제거) · §12 발산 prompt 노트 정리.

## 검증

- `npm test`에 `build-contact-sheet.mjs` 단위 테스트 추가(3방향 검증 에러, 토큰 치환, 폰트 매핑/폴백, 스와치 렌더).
- 샘플 `directions.json`으로 `directions.html` 생성 → 브라우저 육안 확인(프로토타입에서 1차 완료).
- Codex 번들: `scripts/`·`references/` 변경 후 `npm run sync` 재생성 필요 여부 확인.

## 비목표 (YAGNI)

- overview.html 의 LLM 자유 저작 방식은 유지(컨택트 시트만 템플릿화).
- 발산 4방향+ 확장, 컨택트 시트 내 이미지 삽입은 하지 않는다(순수 데이터 게이트 유지).
