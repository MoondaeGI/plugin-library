# HTML 오버뷰 작성 가이드 (overview.html)

`design-brand-kit`이 `overview.html`을 저작할 때 읽는 허브. 이 파일은 **(1) 어떤 레이아웃 아키타입을 고를지**와 **(2) 모든 아키타입 공통의 출력·렌더 규칙·원칙**만 담는다. 개별 골격(구조·CSS 스켈레톤·불변·자유 존)은 `references/archetypes/<name>.md`에 있다.

## 산출물
- 단일 self-contained `overview.html`(CSS 인라인). 자산은 `../assets/brand-kit/...` `<img>`(view/에서 제자리 저작).
- 데이터(색·타이포·보이스·가치·카피)는 `BRAND_KIT.md`/`brand-tokens.json`에서 가져온다 — **지어내지 않는다**. 변주는 레이아웃에서만.

## 원칙 (반드시 지킬 것)

1. **포스터 한 장 느낌** — 떠다니는 카드 묶음/웹 대시보드가 아니라 **하나의 종이에 짜인 브랜드 가이드 포스터**. 카드 박스·그림자 남발 금지. 여백·헤어라인·타이포 위계로 구획하고 전체가 한 장의 디자인으로 읽히게.
2. **밀집하되 숨 쉬게** — 한눈에 들어오되 답답하지 않게. 핵심 이미지(워드마크·로고·UI 목업)는 **충분히 크게**. 너무 작아 안 보이면 실패.
3. **고정 로고 시리즈** — §6의 로고/락업/심볼/앱아이콘/파비콘은 **px 고정 크기**. 락업(심볼+워드마크)은 **타이트·실사용** — 캡높이 정렬, 절제된 gap, 실제 쓸 수 있는 형태. 로고가 가로 폭을 받으면 락업+변형을 나란히 둔다.
4. **autocrop 전제** — 컷아웃 자산(logo·wordmark·icons)은 `--autocrop`으로 투명 여백이 잘려 **마크가 캔버스를 꽉 채운 상태**로 들어온다. 그래서 `height:Npx`가 곧 마크 크기가 된다. (autocrop 안 하면 gpt-image가 남긴 큰 여백 때문에 마크가 콩알만 해진다 — 컷아웃 생성에 반드시 `--autocrop`.) 비정사각 아이콘은 `object-fit:contain`. (워드마크는 **이미지 모드에 한함** — 폰트 모드면 컷아웃 없음). **예외 — 제시용 로고**: `design-logo`의 제시용 로고는 autocrop을 쓰지 않아 여백을 품는다. §6 로고 자리는 이미 `max-height`+`object-fit:contain`이라 그대로 graceful하게 받는다(고정 height 강제 금지).
5. **실폰트** — `../../references/design/font-catalog.md`의 실존 family를 CDN `<link>`로 로드. §8 타이포는 살아있는 스펙시먼. 브랜드에 `accent`(인용/에디토리얼) 폰트가 있으면 풀쿼트·인용·히어로 태그라인 등 **소량 포인트**에 쓴다(본문 아님).
6. **색은 시스템으로** — 스와치 + HEX + 용도(세로 컬러 레전드·컬러 바 등). 진짜 CSS 색(`brand-tokens.json` 권위값).
7. **섹션 인벤토리** — §1 히어로 · §2 에센스 · §3 타깃 · §4 가치 · §5 태그라인 · §6 로고 · §7 색 · §8 타이포 · §9 보이스 · §10 UI · §11 이미지/아이콘. 로고 외 8개 이상 한눈에. §12(다음 결정)는 렌더 안 함.

## 섹션 → 자산/데이터 매핑

- **§1** `../assets/brand-kit/key-visual.png` 배경 `<img>` + `../assets/brand-kit/wordmark-base.png` `<img>`(크게) + 한 줄 설명·포지셔닝(텍스트) + CSS 스크림으로 가독성. — **폰트 모드면** 워드마크는 `<img>` 대신 `<span class="wordmark">브랜드명</span>`(크게). `.wordmark`는 tokens.css가 정의.
- **§6** `../assets/logo/logo.png`(심볼 — **캐노니컬 로고 경로**; brand-kit이 `logo-base.png`에서 시드, design-logo가 덮어씀)·`../assets/brand-kit/wordmark-base.png`(락업) + 변형(심볼 단독 · 앱아이콘[브랜드색 라운드 타일 위 favicon.png, 색 보존] · 파비콘) + 구성·의미 텍스트. 로고 자리는 `max-height`+`object-fit:contain`으로 저작해 확정 마크 종횡비가 base와 달라도 graceful하게 degrade한다(고정 height 강제 금지). **`<!-- design-logo:slot -->` 마커는 쓰지 않는다** — design-logo는 이 경로 파일을 덮어쓰는 방식이라 HTML 편집이 없다. — **폰트 모드면** 락업의 워드마크 부분을 `<span class="wordmark">`로 대체(심볼은 그대로 이미지).
  - **락업 패밀리 렌더(6종)**: §6에 다음을 모두 렌더한다 — ① 가로 `.lockup` · ② 세로 `.lockup.lockup--stacked` · ⑤ 심볼 단독(`<img src="../assets/logo/logo.png">`) · ⑥ 워드마크 단독(이미지 모드 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">` | 폰트 모드 `<span class="wordmark">브랜드명</span>`)은 **항상**. 태그라인이 있으면 ③ 가로+태그라인 · ④ 세로+태그라인도 추가. 가로/세로 구조: `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`, 태그라인은 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>`. **이미지 모드 워드마크**는 `<span class="wordmark">` 대신 `<img class="wordmark-img" ...>` — 높이는 `.wordmark-img`(tokens.css, `--logo-wm-img-scale`)가, 심볼은 `--logo-mark-scale`이 잡는다(둘 다 토큰, 재구현 금지). 심볼이 없으면 락업·심볼단독 생략, 워드마크 단독만.
  - **favicon/app-icon 마크(PNG)**: favicon/app-icon 자리는 `assets/logo/favicon.png`(brand-kit autocrop 임시 또는 design-logo 정제 마크)를 가리킨다 — 파비콘 `<img src="../assets/logo/favicon.png">`, 16px·32px 미리보기로 가독을 보여준다. **app-icon**은 같은 `favicon.png`를 브랜드색 라운드 타일에 얹어 보여준다 — `<div style="background:var(--color-primary);border-radius:22%;padding:18%"><img src="../assets/logo/favicon.png" style="width:100%;display:block"></div>`(마크 색 보존; 별도 app-icon 파일 없음). `<head>`에 `<link rel="icon" href="../assets/logo/favicon.png">`를 **무조건** 넣는다. favicon은 brand-kit이 이미 임시 저작해 두므로 design-logo 미실행이어도 채워진다.
  - **로고 단색 변형 표시**: 로고를 한 색으로 보여줄 땐 `.mark-mono`(tokens.css)에 `style="-webkit-mask-image:url('../assets/logo/logo.png');mask-image:url('../assets/logo/logo.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로 지정한다. 별도 파일 생성 없음. **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.**
  - **다크 로고 스왑(스펙 B-🅱-i)**: 풀로고를 다크 배경(헤더·히어로·푸터·다크모드)에 쓸 땐 `logo.png`↔`logo-dark.png`를 `prefers-color-scheme`로 스왑한다 — `<picture><source srcset="../assets/logo/logo-dark.png" media="(prefers-color-scheme: dark)"><img src="../assets/logo/logo.png" alt="브랜드"></picture>`. `logo-dark.png`가 없으면(design-logo 미실행/리맵 미적용) 스왑 생략하고 `logo.png`만. 작은 마크·favicon은 단일 `favicon.png` 한 장이라 다크 스왑 없이 그대로 쓴다.
- **§7** tokens 색 → 스와치 + HEX + 용도.
- **§8** font-catalog 폰트 → Display/H1/H2/Body/Caption/Mono 스펙시먼. accent 폰트가 있으면 그 스펙시먼도 한 줄 보여준다.
- **§10** `../assets/brand-kit/ui-base.png` 크게(목업이 주인공) + UI 방향 노트.
- **§11** `../assets/brand-kit/icon/*.png` 행 + 스타일·폼 규칙 노트. 컨셉 아이콘 다음에 `<!-- design-iconset:slot -->…<!-- /design-iconset:slot -->` 마커 슬롯을 넣어 design-iconset이 확정 SVG 세트를 주입할 자리를 만든다.
- **§2·3·4·5·9** `BRAND_KIT.md` 데이터 텍스트(+ 필요 시 장식 아이콘 `../assets/brand-kit/icon/*`).

## 레이아웃 아키타입 선택 (기본값 없음)

단일 모범답안이 아니라 **동등한 4개 메뉴**다. 브랜드 성격에 맞는 하나를 고르거나 블렌딩한다 — A로 흘려보내지 말 것.

| 아키타입 | 성격 | 어울리는 브랜드 신호 | 파일 |
|---|---|---|---|
| A 룰드 모듈 그리드 | 시스템틱·정연 | 테크·SaaS·도구·정밀·중립 | `archetypes/a-ruled-grid.md` |
| B 에디토리얼 스프레드 | 비대칭·여백·세리프 인용 | 럭셔리·문학·에디토리얼·따뜻함 | `archetypes/b-editorial.md` |
| C 사이드바 + 캔버스 | 프로덕트 UI·강한 대비 | 프로덕트·도구·대시보드·앱 | `archetypes/c-sidebar.md` |
| D 스택 밴드 | 풀폭 밴드·큰 타입·대담 | 마케팅·대담·실험·강한 퍼스낼리티 | `archetypes/d-stacked-bands.md` |

**선택 규칙:**
- 브랜드 신호(미감·페르소나·무드)로 고른다. accent 세리프가 있고 따뜻/에디토리얼이면 B, 차분/미니멀이면 D는 피한다.
- **고른 아키타입과 한 줄 근거를 `brief.md`의 "레이아웃 메모"에 먼저 적고**(HTML 저작 전), 그 아키타입 파일의 스켈레톤·불변·자유 존을 따라 저작한다. 블렌딩 허용(예: "C 골격 + B의 세리프 풀쿼트") — 근거에 명시.
- **분위기 열림(3방향)**이면 방향마다 **다른 아키타입**을 배정해 구조까지 갈라지게 한다(안전한 SaaS형→A · 프리미엄 에디토리얼형→B · 대담한 실험형→D 등).

## 생성 효율

- **독립 자산은 병렬 생성** — 서로 다른 자산은 `image-gen`을 **동시(백그라운드) 호출**해 병렬로 만든다(이미지 여러 장은 순차로 하면 오래 걸린다). 다듬기 루프는 순차.
- 컷아웃은 `--model gpt-image-1.5 --background transparent --autocrop`, 사진·UI 목업은 `--model gpt-image-2`(autocrop 안 함).
