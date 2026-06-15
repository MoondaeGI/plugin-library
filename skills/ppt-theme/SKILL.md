---
name: ppt-theme
description: Use when ppt 덱의 테마(색·폰트·레이아웃 좌표)를 보거나 새로 만들 때 — 테마를 열람하거나, 색·폰트를 손본 커스텀 테마를 skills/ppt-theme/themes/에 저장한다. 덱 작업(ppt-plan/create)과는 별개 주기로 가끔 쓴다. 회사 공식 템플릿(.potx) 이식은 아직 없다.
---

# PPT Theme

테마(theme.json)의 열람·저작. 파이프라인 본체(ppt-plan/create)와 직교 — 여기서 만든 테마를 ppt-create가 이름으로 소비한다.

## 테마 위치 (한 곳)

- 모든 테마는 `skills/ppt-theme/themes/<이름>/theme.json`에 둔다. 내장이든 직접 만든 커스텀이든 같은 폴더 — 이 repo에 커밋되어 git로 머신 간 따라온다. 별도 env(`PPT_THEME_DIR`)나 머신 로컬 경로 설정은 없다.
- 동봉된 기본 테마는 `default-corporate` 하나. 새 테마를 만들면 같은 폴더에 `<새이름>/theme.json`으로 추가된다.

## 할 수 있는 일

1. **열람**: 테마 목록과 각 테마의 색·폰트를 보여준다. (`scripts/lib/ppt/load-theme.mjs`의 `availableThemes()`가 목록 권위.)
2. **커스텀 저작**: 기존 테마를 베이스로 색·폰트·좌표를 사용자와 합의해 바꾸고 `skills/ppt-theme/themes/<새이름>/theme.json`으로 저장. **저장 전** 그 테마로 3장짜리 샘플 spec을 렌더(`render-deck.mjs`)→PNG export로 미리보기를 보여 확인받는다. 저장한 테마는 소스라 커밋되며, Codex 반영을 위해 `npm run sync`가 필요하다.
3. **검증**: theme.json은 레이아웃 8종(title·section·bullets·two-col·chart·table·image·closing)을 모두 정의해야 한다 — 누락 시 `load-theme.mjs`가 `ThemeInvalidError`로 거부한다.

## theme.json 구조

```json
{
  "name": "<테마 이름>",
  "colors": { "primary": "1A3E6E", "accent": "2E6FB7", "text": "2B2B2B",
              "muted": "6B7280", "background": "FFFFFF", "surface": "F3F5F8" },
  "fonts": { "heading": "맑은 고딕", "body": "맑은 고딕" },
  "layouts": {
    "title": {
      "backgroundColor": "1A3E6E",
      "placeholders": {
        "title": { "x": 0.9, "y": 2.6, "w": 11.5, "h": 1.4, "fontSize": 40, "bold": true, "color": "FFFFFF" }
      }
    }
  }
}
```

- 좌표 단위는 인치, 슬라이드는 16:9(13.333 × 7.5). 색은 `#` 없는 6자리 hex.
- 각 레이아웃은 텍스트 자리(`placeholders`)와, chart/table/image는 `contentBox`를 둔다.
- 베이스로 삼을 정확한 좌표는 `skills/ppt-theme/themes/default-corporate/theme.json`을 복사해 고치는 게 빠르다.

## 비범위 (아직)

- potx 이식(회사 템플릿 → theme.json 변환)은 후속 구현 예정. 요청받으면 "아직 없고, 색·폰트를 알려주시면 커스텀 테마로 수동 제작 가능"이라고 안내한다.
