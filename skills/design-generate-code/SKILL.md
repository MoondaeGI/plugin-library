---
name: design-generate-code
description: （placeholder · 미구현 — 아직 호출하지 말 것）web-publisher가 빌드한 풀페이지 프로토타입과 export된 컴포넌트 세트를 바탕으로 대상 프로젝트의 실제 페이지·앱 코드(React/Next 등)를 생성하는 다운스트림 최종 단계. 소유는 front-developer 에이전트. 범위·게이트·산출물은 아직 설계 전이며 별도 논의에서 확정한다.
---

# Design Generate Code (계획 중 — 미구현)

> **상태: placeholder.** 이 스킬은 아직 구현되지 않았다. 호출하지 말 것 — 범위가 확정되면 별도 논의·설계(brainstorming → spec → plan)를 거쳐 작성한다.

## 의도 (확정 전 메모)

디자인 다운스트림의 **최종 코드 생성** 단계 — 대상 프로젝트에 실제 페이지·앱 코드를 만든다. 소유: **front-developer** 에이전트.

- 입력(예정): web-publisher가 빌드한 `prototype/index.html`(풀페이지 프로토타입), `design-component-export` 산출 컴포넌트 세트, `DESIGN.md`·`.design/assets/css/tokens.css`.
- 산출(예정): 대상 프로젝트의 실제 페이지·앱 코드(React/Next 등). 컴포넌트는 component-export 세트를 재사용한다.
- 미결: 타깃 프레임워크·라우팅·상태관리 게이트, 디렉터리 규약, 프로토타입→코드 변환 충실도 기준.

`design-component-export`(컴포넌트 라이브러리)와 역할이 다르다 — 이쪽은 그 컴포넌트로 **실제 화면·앱**을 조립한다.

설계가 시작되면 이 파일을 정식 SKILL.md로 대체한다.
