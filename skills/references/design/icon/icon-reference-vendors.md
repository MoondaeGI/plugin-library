# 아이콘 벤더 레퍼런스 (Icon Reference Vendors)

이 문서는 **아이콘 스타일 분석용 agent-facing 레퍼런스**다. 특정 벤더의 아이콘을 복제하지 않는다. 추출할 것은 **스타일 원칙·밀도·stroke·corner·filled/line 사용 방식·상태 표현 방식**뿐이다.

> **인용 금지:** 이미지 모델은 "Linear처럼"을 그리지 못한다. 이 문서는 agent가 `icon-style-catalog.md`에서 파라미터를 고를 때 쓰는 보정용이며, **벤더명을 `BRAND_KIT.md §11`이나 이미지 프롬프트에 절대 쓰지 않는다.** 추출한 *원칙*만 프롬프트에 반영한다.

## Apple SF Symbols
- 시스템 UI에 최적화된 glyph 중심. line과 filled 변형이 체계적으로 존재. 작은 크기 식별성 좋음.
- 참고 포인트: size별 안정성, active/inactive 변형.

## Material Symbols
- outlined / rounded / sharp / filled 등 스타일 축이 명확. 대규모 제품 전반에 쓰기 좋음.
- 참고 포인트: 스타일 variant 관리, 상태별 icon family.

## Atlassian
- 협업/업무툴에 맞는 실용적 아이콘 언어. 과하게 장식적이지 않고 기능 이해가 빠름.
- 참고 포인트: B2B SaaS 기능 아이콘의 명확성.

## Linear
- 미니멀하고 정밀한 제품 UI 아이콘. 개발자/프로덕트 도구에 잘 맞음.
- 참고 포인트: 작은 UI 안에서의 절제된 디테일.

## Stripe
- 문서·결제·인프라 느낌을 깔끔하게 표현. line과 simple shape의 균형이 좋음.
- 참고 포인트: 복잡한 개념을 단순 아이콘으로 줄이는 방식.

## 주의
- 특정 벤더의 형태를 그대로 따라 하지 않는다.
- 브랜드 고유 아이콘처럼 보이도록 메타포와 스타일을 재해석한다.
