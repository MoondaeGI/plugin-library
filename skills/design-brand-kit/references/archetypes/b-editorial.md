# 아키타입 B — 에디토리얼 스프레드 (Editorial Spread)

- **성격**: 잡지 표지+속지. 비대칭·여백·세리프 인용 중심. 따뜻하고 사려 깊은 결.
- **어울리는 브랜드 신호**: 럭셔리·문학·에디토리얼·따뜻함·라이프스타일. accent(세리프) 폰트가 있을 때 특히.

## 구조
마스트헤드(2px 룰) + 비대칭 2단 히어로(좌: 워드마크+큰 세리프 풀쿼트 / 우: 세로 키비주얼) + 드롭캡 2단 본문(에센스) + 12열 에디토리얼 모듈 행(가치·타깃·로고·색·타이포·보이스·UI·아이콘).
- 워드마크 슬롯 = 이미지 모드 `<img>` | 폰트 모드 `<span class="wordmark">`.

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ max-width:1200px; margin:0 auto; background:var(--paper); box-shadow:var(--lg); }
.pg{ padding:60px 68px; }
.masthead{ display:flex; justify-content:space-between; align-items:baseline; border-bottom:2px solid var(--text); padding-bottom:14px; }
.spread{ display:grid; grid-template-columns:1.15fr .85fr; gap:48px; align-items:center; padding-top:46px; }  /* 비대칭 */
.spread .pull{ font-family:var(--accentf); font-size:40px; line-height:1.32; color:var(--primary); }          /* 세리프 풀쿼트 = 주연 */
.spread .ph{ aspect-ratio:3/4; overflow:hidden; } .spread .ph img{ width:100%; height:100%; object-fit:cover; }
.prose{ columns:2; column-gap:48px; border-top:1px solid var(--line); padding-top:30px; }
.prose p:first-child::first-letter{ font-family:var(--display); font-size:58px; float:left; line-height:.82; padding:6px 12px 0 0; color:var(--accent); } /* 드롭캡 */
.erow{ display:grid; grid-template-columns:repeat(12,1fr); gap:38px 44px; border-top:2px solid var(--text); padding-top:38px; }
.col4{grid-column:span 4} .col6{grid-column:span 6} .col12{grid-column:span 12}
```

## 불변 (must-hold)
- 비대칭 2단 히어로 + **세리프(accent) 풀쿼트가 주연**.
- 넉넉한 여백, 2px 룰 마스트헤드/디바이더. 카드 박스 아님.

## 자유 존 (브랜드별로 결정)
- 드롭캡 사용 여부·색.
- 히어로 좌우 비율·키비주얼 종횡비(3/4 ↔ 1/1).
- 모듈 행 열 배분(col4/col6/col12 조합)과 섹션 순서.
- 라이트/다크, 본문 단 수(1 ↔ 2), 밀도.

> accent 폰트가 토큰에 없으면 이 아키타입은 부적합 — A/C/D 중에서 고른다.
