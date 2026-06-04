# 아키타입 A — 룰드 모듈 그리드 (Ruled Module Grid)

- **성격**: 시스템틱·정연·차분. 한 장의 종이에 짜인 모듈 그리드.
- **어울리는 브랜드 신호**: 테크·SaaS·도구·정밀·중립. 미감이 "구조/시스템" 쪽일 때.

## 구조
상단 스트립 + 풀폭 히어로(키비주얼 배경 + 워드마크) + 6열 헤어라인 모듈 그리드(카드 박스 없음, gap 1px가 line 색으로 비침) + 하단 스트립. 섹션을 span으로 배치.
- 워드마크 슬롯 = 이미지 모드 `<img>` | 폰트 모드 `<span class="wordmark">`.

## 압축 CSS 스켈레톤 (색·폰트·radius는 tokens에서)
```css
body{ background:radial-gradient(1100px 700px at 50% -10%, var(--mat1), var(--mat2) 70%); padding:44px 24px 70px; }
.sheet{ max-width:1180px; margin:0 auto; background:var(--paper); box-shadow:0 2px 6px rgba(0,0,0,.10), 0 40px 90px rgba(0,0,0,.22); }
.strip{ display:flex; justify-content:space-between; padding:13px 30px; border-bottom:1px solid var(--line);
        font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
.hero{ position:relative; min-height:400px; display:flex; align-items:flex-end; overflow:hidden; }
.hero img.bg{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hero .scrim{ position:absolute; inset:0; background:linear-gradient(92deg, var(--paper) 0%, rgba(255,255,255,.16) 62%, transparent 100%); }
.hero .inner{ position:relative; padding:48px 50px; max-width:680px; }
.hero .mark{ height:108px; width:auto; }
.grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--line); }
.mod{ background:var(--paper); padding:26px 28px; }
.c2{grid-column:span 2} .c3{grid-column:span 3} .c4{grid-column:span 4} .full{grid-column:1/-1}
```

## 불변 (must-hold)
- 헤어라인 모듈 그리드(gap 1px + line 배경). **카드 박스·그림자 남발 금지.**
- 전체가 한 장의 종이로 읽힌다.

## 자유 존 (브랜드별로 결정)
- 그리드 열 수(6 ↔ 4)와 모듈 span 배치·섹션 순서.
- 히어로 높이·스크림 방향·워드마크 크기.
- 라이트/다크, 매트 배경 톤, 밀도(airy ↔ packed).
- 상·하단 스트립 유무·내용.
