---
name: design-component-export
description: （placeholder · 미구현 — 아직 호출하지 말 것）확정된 ui-kit.css·tokens.css를 대상 프로젝트의 plain CSS 컴포넌트 세트 + 얇은 React/Next 래퍼로 export하는 단계. 소유는 front-developer 에이전트이며 designer 핵심 파이프라인(md-compiler) 직후에 온다. 범위·게이트·산출물은 아직 설계 전이며 별도 논의에서 확정한다.
---

# Design Component Export (계획 중 — 미구현)

> **상태: placeholder.** 이 스킬은 아직 구현되지 않았다. 호출하지 말 것 — 범위가 확정되면 별도 논의·설계(brainstorming → spec → plan)를 거쳐 작성한다.

## 의도 (확정 전 메모)

**대상 프로젝트에 실제 컴포넌트 세트 생성**을 담당할 단계의 자리표시자. 소유: **front-developer** 에이전트. 위치: designer 핵심 파이프라인(`…ui-kit → md-compiler`) 직후. 다운스트림 최종 코드 생성은 별도 단계(`design-generate-code`)다.

- 입력(예정): `.design/assets/ui-kit/ui-kit.css`(권위 컴포넌트 CSS), `.design/assets/tokens.css`(토큰), 확정 자산.
- 산출(예정): 대상 프로젝트에 **plain CSS canonical 세트** + 얇은 React/Next 컴포넌트 래퍼(className만 입히는 wrapper). 스타일링은 프레임워크 중립(CSS 변수)로 가는 방향.
- 미결: 타깃 프레임워크/스타일링 전략 게이트, 디렉터리 규약, 자산 포맷(로고/워드마크) 소비 방식.

설계가 시작되면 이 파일을 정식 SKILL.md로 대체한다.
