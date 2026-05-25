---
name: image-gen
description: 구성된 텍스트 프롬프트를 래스터 이미지 파일로 만들 때 사용한다 — OpenAI Images API를 직접 호출하는 Codex 비의존 공유 생성기. design-brand-kit·design-page-image 등 이미지 생성이 필요한 스킬이 공통으로 호출한다. OPENAI_API_KEY 필요.
---

# image-gen

프롬프트를 받아 래스터 이미지를 만드는 **공유 스크립트**. 모든 이미지 생성 로직이 이걸 호출한다 — Codex 내장 `image_gen` 도구에 의존하지 않으므로 Claude·Codex 어디서든 동작하고, 출력 위치를 직접 지정한다.

범용이다: **프롬프트 in → 이미지 out**. 스킬별 브리프/포맷은 알지 못한다 — 호출하는 쪽(예: `design-brand-kit`)이 자기 브리프에서 프롬프트를 구성해 넘긴다.

## 스크립트

`<이 스킬 디렉터리>/scripts/image-gen.mjs` — 외부 의존성 없음(Node ≥18 전역 fetch). 다른 스킬은 형제 경로 `<자기 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs`로 호출한다.

## 전제: OPENAI_API_KEY

OpenAI Images API를 직접 호출하므로 `OPENAI_API_KEY` 환경변수가 필요하다. `.env`에 적은 뒤 `npm run env:apply`로 OS에 등록(또는 직접 환경변수 설정). 없으면 생성 불가 — 그때만 사람이 이미지를 직접 드롭하는 폴백을 쓴다.

## 사용

```bash
node "<image-gen 스킬 디렉터리>/scripts/image-gen.mjs" \
  --prompt-file <프롬프트 파일> \
  --out "<cwd>/.design/generated/.../name.png" \
  --size 1024x1536 --quality high --model gpt-image-2
```

- **프롬프트**: 긴/한국어 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다(셸 인용 회피). 짧으면 `--prompt`.
- **`--out`**: **대상 프로젝트 cwd 기준 절대 경로**. 스크립트가 폴더를 만들고 거기 바로 쓴다(옮길 필요 없음). 저장된 절대 경로를 stdout에 출력. 기존 파일은 `--force` 없이는 안 덮음.
- **모델/크기/품질**: 기본 `gpt-image-2`(키 접근권 없으면 `--model gpt-image-1`). `--size auto` 또는 `WIDTHxHEIGHT`(gpt-image-2: 변 16의 배수, 최대 3840, 비율 ≤3:1). 초안 `--quality low`, 확정본 `--quality high`.
- **변형**: 한 프롬프트의 변형은 `--n`(파일명에 `-1`,`-2` 접미). 서로 다른 산출물은 `--n`이 아니라 개별 호출.
- **미리보기**: `--dry-run`은 키 없이 페이로드·출력 경로만 출력. 전체 옵션은 `--help`.

## When to use

- 스킬이 구성한 프롬프트를 실제 이미지 파일로 만들어야 할 때.
- **쓰지 않음**: 프롬프트 작성·브리프 구성·아트 디렉션은 호출하는 도메인 스킬의 몫이다. 이 스킬은 생성 메커니즘만 담당한다.
