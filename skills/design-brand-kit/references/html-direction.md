# HTML 오버뷰 작성 가이드 (overview.html)

`design-brand-kit`이 `overview.html`을 저작할 때 읽는 가이드. **고정 템플릿이 아니다** — 아래 원칙을 지키되 레이아웃·비주얼은 브랜드별로 LLM이 저작한다(다양성). 아래 레퍼런스 스켈레톤은 "강제"가 아니라 **검증된 좋은 출발점**이다. (룰드 모듈 그리드까지 강제하면 그냥 템플릿이 된다 — 원칙만 지키고 레이아웃은 변주하라.)

## 산출물

- 단일 self-contained `overview.html`(CSS 인라인). 자산은 **형제 `assets/...` 상대경로** `<img>` — route 폴더든 확정 top이든 final이든 동일 HTML이 동작.
- 데이터(색·타이포·보이스·가치·카피 등)는 `BRAND_KIT.md`/`brand-tokens.json`에서 가져온다 — **지어내지 않는다**. 변주는 레이아웃에서만.

## 원칙 (반드시 지킬 것)

1. **포스터 한 장 느낌** — 떠다니는 카드 묶음/웹 대시보드가 아니라 **하나의 종이에 짜인 브랜드 가이드 포스터**. 카드 박스·그림자 남발 금지. 여백·헤어라인·타이포 위계로 구획하고 전체가 한 장의 디자인으로 읽히게.
2. **밀집하되 숨 쉬게** — 한눈에 들어오되 답답하지 않게. 핵심 이미지(워드마크·로고·UI 목업)는 **충분히 크게**. 너무 작아 안 보이면 실패.
3. **고정 로고 시리즈** — §6의 로고/락업/심볼/앱아이콘/파비콘은 **px 고정 크기**. 락업(심볼+워드마크)은 **타이트·실사용** — 캡높이 정렬, 절제된 gap, 실제 쓸 수 있는 형태. 로고가 가로 폭을 받으면 락업+변형을 나란히 둔다.
4. **autocrop 전제** — 컷아웃 자산(logo·wordmark·icons)은 `--autocrop`으로 투명 여백이 잘려 **마크가 캔버스를 꽉 채운 상태**로 들어온다. 그래서 `height:Npx`가 곧 마크 크기가 된다. (autocrop 안 하면 gpt-image가 남긴 큰 여백 때문에 마크가 콩알만 해진다 — 컷아웃 생성에 반드시 `--autocrop`.) 비정사각 아이콘은 `object-fit:contain`.
5. **실폰트** — `../../references/design/font-catalog.md`의 실존 family를 CDN `<link>`로 로드. §8 타이포는 살아있는 스펙시먼.
6. **색은 시스템으로** — 스와치 + HEX + 용도(세로 컬러 레전드·컬러 바 등). 진짜 CSS 색(`brand-tokens.json` 권위값).
7. **섹션 인벤토리** — §1 히어로 · §2 에센스 · §3 타깃 · §4 가치 · §5 태그라인 · §6 로고 · §7 색 · §8 타이포 · §9 보이스 · §10 UI · §11 이미지/아이콘. 로고 외 8개 이상 한눈에. §12(다음 결정)는 렌더 안 함.

## 섹션 → 자산/데이터 매핑

- **§1** `key-visual.png` 배경 `<img>` + `wordmark-base.png` `<img>`(크게) + 한 줄 설명·포지셔닝(텍스트) + CSS 스크림으로 가독성.
- **§6** `logo-base.png`(심볼)·`wordmark-base.png`(락업) + 변형(심볼 단독 · 앱아이콘[브랜드색 라운드 타일, `filter:brightness(0) invert(1)`로 흰 마크] · 파비콘) 고정 크기 + 구성·의미 텍스트.
- **§7** tokens 색 → 스와치 + HEX + 용도.
- **§8** font-catalog 폰트 → Display/H1/H2/Body/Caption/Mono 스펙시먼.
- **§10** `ui-base.png` 크게(목업이 주인공) + UI 방향 노트.
- **§11** `icons/*.png` 행 + 스타일·폼 규칙 노트.
- **§2·3·4·5·9** `BRAND_KIT.md` 데이터 텍스트(+ 필요 시 장식 아이콘 `icons/*`).

## 레퍼런스 스켈레톤 (권장 출발점 · 강제 아님)

검증된 한 구성: **상단 스트립 + 풀폭 히어로 + 룰드 모듈 그리드(헤어라인으로만 구획, 카드 박스 없음) + 하단 스트립.** 6열 그리드에 모듈을 span으로 배치한 예: `§2·§3·§4` / `§5(2)+§6(4 넓게)` / `§7색·§8타이포·§9보이스` 한 줄 / `§10·§11`. **이게 정답은 아니다** — 브랜드 성격에 맞춰 다른 포스터 레이아웃으로 변주하라(원칙 1~7만 지키면 된다).

압축 CSS 스켈레톤(그대로 쓰거나 변주; 색·폰트·악센트·radius는 tokens에서):

```css
body{ background:radial-gradient(1100px 700px at 50% -10%, #mat1, #mat2 70%); padding:44px 24px 70px; }
.sheet{ max-width:1180px; margin:0 auto; background:var(--paper); box-shadow:0 2px 6px rgba(0,0,0,.10), 0 40px 90px rgba(0,0,0,.22); }   /* 한 장의 종이 */
.strip{ display:flex; justify-content:space-between; padding:13px 30px; border-bottom:1px solid var(--line);
        font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
.hero{ position:relative; min-height:400px; display:flex; align-items:flex-end; overflow:hidden; }
.hero img.bg{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hero .scrim{ position:absolute; inset:0; background:linear-gradient(92deg, var(--paper) 0%, rgba(255,255,255,.16) 62%, transparent 100%); }
.hero .inner{ position:relative; padding:48px 50px; max-width:680px; }
.hero .mark{ height:108px; width:auto; }                                  /* 워드마크 크게·고정 */
/* 룰드 모듈 그리드 — gap 1px + 배경 line 색이 헤어라인으로 비침(카드 박스 없음) */
.grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--line); }
.mod{ background:var(--paper); padding:26px 28px; }
.c2{grid-column:span 2} .c3{grid-column:span 3} .c4{grid-column:span 4} .full{grid-column:1/-1}
/* §6 로고 — 고정 크기 시리즈 + 타이트 락업 */
.lockup{ display:flex; align-items:center; gap:18px; min-height:104px; }
.lockup img.sym{ height:74px; width:auto; }  .lockup img.wm{ height:46px; width:auto; }   /* 고정·캡높이 정렬 */
.lvw.sym img{height:52px} .lvw.app img{height:46px; filter:brightness(0) invert(1)} .lvw.fav img{height:26px}
/* §7 색 — 세로 컬러 레전드 */
.sw{ display:flex; align-items:center; gap:11px; padding:5.5px 0; }
.sw .chip{ width:16px; height:16px; border-radius:5px; flex:none; }
/* 아이콘 — 비정사각 대비 */
.ic img, .ess img, .pil img{ object-fit:contain; }
```

> ⚠ 색·radius·폰트 스택은 위 `var(--…)`를 `brand-tokens.json` 값으로 채운다. `--mat1/--mat2`는 배경 매트(brand bg보다 약간 어둡게)·`--paper`는 시트(밝게).

## 생성 효율

- **독립 자산은 병렬 생성** — 서로 다른 자산(또는 발산 route별 자산)은 `image-gen`을 **동시(백그라운드) 호출**해 병렬로 만든다(이미지 여러 장은 순차로 하면 오래 걸린다). 다듬기 루프는 순차.
- 컷아웃은 `--model gpt-image-1.5 --background transparent --autocrop`, 사진·UI 목업은 `--model gpt-image-2`(autocrop 안 함).
