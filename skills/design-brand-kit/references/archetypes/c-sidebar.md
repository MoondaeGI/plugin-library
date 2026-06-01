# 아키타입 C — 사이드바 + 캔버스 (Sidebar + Canvas)

- **성격**: 프로덕트 UI 같은 좌측 인덱스 + 넓은 작업면. 색 대비가 강해 분위기가 또렷.
- **어울리는 브랜드 신호**: 프로덕트·도구·대시보드·앱. "쓰는 물건" 느낌이 필요할 때.

## 구조
좌측 어두운 고정 사이드바(워드마크[흰 반전]·컬러 레전드·타이포 미니 스펙시먼·섹션 목차[하단 고정]) + 우측 캔버스(상단 와이드 키비주얼 히어로 + 2열 콘텐츠 셀 + 풀폭 UI + 아이콘 행).

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ display:grid; grid-template-columns:268px 1fr; }
.side{ background:var(--primary-dark); color:#E7DECF; padding:34px 26px; display:flex; flex-direction:column; gap:26px; }
.side img.wm{ height:46px; filter:brightness(0) invert(1); }   /* 어두운 바탕 → 흰 워드마크 */
.side .idx{ margin-top:auto; }                                  /* 섹션 목차는 하단 고정 */
.canvas{ background:var(--paper); }
.chero{ position:relative; height:300px; overflow:hidden; } .chero img{ width:100%; height:100%; object-fit:cover; }
.chero .ov{ position:absolute; inset:0; background:linear-gradient(80deg, rgba(54,73,95,.78), transparent 70%); }
.cgrid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); }
.cell{ background:var(--paper); padding:26px 30px; } .cell.full{ grid-column:1/-1; }
```

## 불변 (must-hold)
- 좌측 **어두운 고정 사이드바 인덱스**(주색/주색-dark 바탕 + 밝은 텍스트).
- 우측은 넓은 캔버스가 주인공(히어로·UI 크게).

## 자유 존 (브랜드별로 결정)
- 사이드바 폭·바탕(주색 ↔ 주색-dark ↔ sand)·담는 항목 순서.
- 캔버스 셀 그리드(2열 ↔ 3열), 히어로 높이·오버레이 방향.
- 사이드바 좌/우 배치(좌측 기본, 우측도 가능).
- 밀도.
