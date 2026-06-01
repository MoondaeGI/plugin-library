# 아키타입 D — 스택 밴드 (Stacked Bands)

- **성격**: 풀폭 수평 밴드를 위→아래로 쌓기. 밴드별 배경색 대비, 큰 타입. 대담·하이에너지.
- **어울리는 브랜드 신호**: 마케팅·대담·실험·강한 퍼스낼리티. 차분/미니멀과는 반대.

## 구조
밴드 시퀀스: §1 풀폭 히어로(키비주얼 풀블리드 + 워드마크 오버레이) → §5 태그라인 밴드(주색 바탕, 초대형 세리프) → 트리오 밴드(에센스·타깃·가치 3열) → §7 풀폭 컬러 바 → 스플릿 밴드(타이포 | 보이스) → 로고 밴드(어두움) → UI 밴드 → 아이콘 밴드. 밴드 배경색 교대.

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ max-width:1200px; margin:0 auto; }
.band{ padding:46px 60px; }
.bn{ font-family:var(--mono); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; }
.b-hero{ position:relative; height:380px; padding:0; overflow:hidden; } .b-hero img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.b-tag{ background:var(--primary); color:#fff; text-align:center; padding:62px 60px; }
.b-tag .big{ font-family:var(--accentf); font-size:46px; line-height:1.3; }          /* 초대형 인용/태그라인 */
.colorbar{ display:flex; height:140px; }                                              /* 풀폭 컬러 바 */
.colorbar .c{ flex:1; display:flex; flex-direction:column; justify-content:flex-end; padding:14px; }
/* 밴드 배경 교대 예: paper → primary → paper → sand → primary-dark → bg */
```

## 불변 (must-hold)
- 풀폭 수평 밴드 스택 + **밴드 간 배경색 대비**.
- §7은 풀폭 컬러 바로.

## 자유 존 (브랜드별로 결정)
- 밴드 순서·개수, 배경색 교대 패턴.
- 태그라인 밴드 타입 크기·폰트(세리프 ↔ 디스플레이).
- 트리오/스플릿 열 수, 히어로 높이·오버레이.
- 밀도.

> 차분·미니멀 브랜드엔 과할 수 있다 — 신호가 "대담/마케팅"이 아니면 A/B/C를 우선 검토.
