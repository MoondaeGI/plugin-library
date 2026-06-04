# 아키타입 C — 사이드바 + 캔버스 (Sidebar + Canvas)

- **성격**: 프로덕트 UI 같은 좌측 인덱스 + 넓은 작업면. 색 대비가 강해 분위기가 또렷.
- **어울리는 브랜드 신호**: 프로덕트·도구·대시보드·앱. "쓰는 물건" 느낌이 필요할 때.

## 구조
좌측 어두운 고정 사이드바 + 우측 캔버스. **사이드바는 길잡이·아이덴티티 chrome 전용**이고, **색·타이포·로고 같은 스펙 데이터는 전부 캔버스가 소유**한다(사이드바에 §7 색 레전드나 §8 타이포 스펙시먼을 두지 말 것 — 캔버스 §7/§8과 중복된다).

- **사이드바**(위→아래): 워드마크[이미지=흰 반전 img.wm | 폰트=흰색 .wordmark] · 섹션 인덱스[제품 nav 스타일 — 그룹·아이콘·번호, 한 항목 활성 강조] · 하단 메타[브랜드명·태그라인 한 줄, `margin-top:auto`로 바닥 고정]. **이 인덱스는 §1~§11을 가리키는 길잡이일 뿐, 섹션 자체를 대체하지 않는다** — 모든 섹션 본문은 캔버스에 있다.
- **캔버스**: html-direction §7의 섹션 인벤토리(§1~§11)를 **전부** 담는다. 권장 흐름 — §1 풀폭 키비주얼 히어로(워드마크 오버레이) → 2열 셀(§2 에센스 | §4 가치) → 2열 셀(§3 타깃 | §5 태그라인) → 풀폭 §6 로고(락업·심볼·앱아이콘·파비콘) → 풀폭 §7 색 레전드 → 풀폭 §8 타이포 스펙시먼 → 풀폭 §9 보이스(O/X) → 2열 셀(§10 UI | §11 아이콘). **§6·§7·§8·§9는 캔버스가 유일한 자리**(사이드바로 빼지 말 것). 셀 묶음·2열↔3열은 자유, 단 §1~§11 누락 금지.

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ display:grid; grid-template-columns:264px 1fr; }
.side{ background:var(--primary-dark); color:#E7DECF; padding:30px 22px; display:flex; flex-direction:column; gap:30px; }
.side img.wm{ height:38px; filter:brightness(0) invert(1); align-self:flex-start; } /* 어두운 바탕 → 흰 워드마크 */
.side .wordmark{ font-size:22px; color:#fff; align-self:flex-start; } /* 폰트 모드: 흰 반전 대신 흰색 텍스트 */
/* 섹션 인덱스 = 제품 nav. 색 스와치/폰트 스펙을 넣지 말 것(캔버스 §7/§8 전담) */
.nav{ display:flex; flex-direction:column; gap:2px; }
.nav .grp{ font:10px var(--mono); letter-spacing:.14em; text-transform:uppercase; color:var(--primary-light); margin:14px 0 6px; }
.nav a{ display:flex; align-items:center; gap:11px; text-decoration:none; color:#CBC2B2; font-size:13.5px; padding:8px 10px; border-radius:8px; }
.nav a .ic{ width:17px; height:17px; filter:brightness(0) invert(1); opacity:.7; }
.nav a .no{ font:10px var(--mono); color:var(--primary-light); margin-left:auto; }
.nav a.on{ background:var(--accent); color:#fff; } /* 활성 항목 = 액센트(또는 주색) */
.side .meta{ margin-top:auto; border-top:1px solid rgba(255,255,255,.12); padding-top:18px; } /* 브랜드·태그라인은 바닥 고정 */
.canvas{ background:var(--paper); }
.chero{ position:relative; height:288px; overflow:hidden; } .chero img{ width:100%; height:100%; object-fit:cover; }
.chero .ov{ position:absolute; inset:0; background:linear-gradient(82deg, rgba(54,73,95,.82), transparent 72%); }
.cgrid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); }
.cell{ background:var(--paper); padding:28px 32px; } .cell.full{ grid-column:1/-1; }
```

## 불변 (must-hold)
- 좌측 **어두운 고정 사이드바**(주색/주색-dark 바탕 + 밝은 텍스트).
- 우측은 넓은 캔버스가 주인공(히어로·UI 크게).
- **사이드바는 chrome(워드마크·내비·메타)만** — 색 레전드·타이포 스펙시먼 등 스펙 데이터는 캔버스(§7/§8)가 소유. 사이드바에 본문 축소판을 두지 않는다.

## 자유 존 (브랜드별로 결정)
- 사이드바 폭·바탕(주색 ↔ 주색-dark ↔ sand)·활성 항목 강조색(액센트 ↔ 주색).
- 사이드바 인덱스 구성: 섹션 그룹핑·순서·아이콘 유무·번호 표기.
- 하단 메타에 담을 것(태그라인 ↔ 에센스 한 줄 ↔ 브랜드명만).
- 캔버스 셀 그리드(2열 ↔ 3열), 히어로 높이·오버레이 방향, 밀도.
- 사이드바 좌/우 배치(좌측 기본, 우측도 가능).
