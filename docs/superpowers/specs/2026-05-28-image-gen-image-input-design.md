# image-gen 이미지 입력(레퍼런스/편집) 설계

- 날짜: 2026-05-28
- 상태: 설계 승인 대기
- 관련 스킬: `image-gen` (대상), `design-brand-kit`·`design-page-image` (잠재 소비자 — 이번 범위 아님)

## 1. 배경 / 문제

`image-gen`의 공유 스크립트(`skills/image-gen/scripts/image-gen.mjs`)는 현재 OpenAI의 `/v1/images/generations` 엔드포인트만 호출한다. 즉 **텍스트 프롬프트 → 이미지**만 가능하고, 이미지를 입력으로 넘길 수 없다.

사용자는 이미지를 프롬프트에 함께 넘기고 싶어 한다 — 두 용도:
- **레퍼런스로 새 이미지 생성**: 입력 이미지의 스타일·색감·요소를 참고해 새 이미지를 만든다.
- **기존 이미지 편집/변형**: 입력 이미지 자체를 수정한다.

## 2. 핵심 인사이트 (이번 설계의 전제)

OpenAI Images API에는 **별도의 "reference" 엔드포인트가 없다.** 공식 문서:
> "The image edits endpoint allows you to edit existing images, generate new images using other images as references, or edit specific parts of an image by providing a mask."

즉 편집·레퍼런스·합성이 **모두 `/v1/images/edits` 하나**로 들어간다. `edits`라는 이름은 "수정 전용"이 아니라 "이미지를 입력으로 끼고 생성"을 뜻한다. "편집인가 레퍼런스인가"의 차이는 엔드포인트가 아니라:

1. **프롬프트 문구** (호출자가 구성)
2. **`input_fidelity`** 파라미터 (`high` = 원본 충실 보존 → 편집/합성, 생략/`low` = 느슨한 참고 → 레퍼런스)

이는 `image-gen`의 설계 철학과 일치한다 — SKILL.md가 *"브리프/포맷은 호출하는 쪽의 몫, 이 스킬은 생성 메커니즘만"*이라고 명시. 따라서 스크립트는 "모드"를 두지 않고, **이미지 첨부 여부로만 엔드포인트를 분기**한다.

## 3. 목표 / 비목표

**목표**
- `image-gen.mjs`가 입력 이미지를 받아 `/v1/images/edits`로 생성/편집할 수 있게 한다.
- 다중 입력 이미지(`image[]`)를 지원한다.
- 레퍼런스/편집을 가르는 손잡이 `input_fidelity`를 노출한다.
- 의존성 0 원칙 유지 (Node ≥18 전역 `fetch`/`FormData`/`Blob`만 사용).
- 응답 파싱·파일 저장·`--out`/`--n`/`--dry-run` 로직은 기존과 공유 — 텍스트→이미지 경로는 무회귀.

**비목표 (YAGNI — 지금 하지 않음)**
- `mask`(영역 한정 편집) 지원. 마스크 이미지를 따로 만들어야 하고, 영역 지정은 프롬프트로도 가능. 추후 필요 시 `--mask`로 추가.
- 상위 design 스킬(`design-brand-kit`·`design-page-image`) 연동. 이번엔 저수준 스크립트만.
- "편집 모드"/"레퍼런스 모드" 같은 명시적 모드 플래그. §2대로 불필요.

## 4. 핵심 결정 (확정)

| 항목 | 결정 | 근거 |
|---|---|---|
| 엔드포인트 분기 | 같은 스크립트에서 `--image` 유무로 분기 (접근법 A) | 호출부 인터페이스 일관(`--image`만 추가), 저장 로직 재사용, 의존성 0 유지. 엔드포인트 2개뿐이라 별도 스크립트/추상화는 과함. |
| 입력 이미지 | `--image <경로>` **반복 가능** → `image[]` 다중 첨부 | 다중 레퍼런스/합성을 한 번에 지원. |
| multipart 구성 | Node 18+ 전역 `FormData` + `Blob` | 외부 의존성 0 유지. `Content-Type`은 `FormData`가 boundary와 함께 자동 설정 — `Authorization` 헤더만 직접 지정. |
| 레퍼런스 vs 편집 | 스크립트는 구분 안 함. 프롬프트 + `--input-fidelity`로 표현 | §2. image-gen은 생성 메커니즘만 담당. |
| `input_fidelity` | `--input-fidelity <high\|low>` 선택 플래그. 지정 시에만 페이로드 포함 | 미지정 시 API 기본값 사용 — 불필요한 값 강제 안 함. |

## 5. CLI 인터페이스 변경

신규 인자:
- `--image <경로>` — 입력/레퍼런스 이미지. 반복 가능. 하나라도 있으면 `/v1/images/edits`로 분기.
- `--input-fidelity <high|low>` — 선택. `high`/`low`만 허용. 지정 시에만 요청에 포함. **gpt-image-2 전용** 파라미터이므로 `--model gpt-image-1`과 함께 쓰면 API가 거부할 수 있다 — 호출자 책임으로 두고, 미지정이 기본.

기존 인자(`--prompt`/`--prompt-file`, `--out`, `--size`, `--quality`, `--model`, `--n`, `--output-format`, `--force`, `--dry-run`)는 그대로, 두 경로 모두에서 동작.

## 6. 동작 흐름

```
opts.images = [] (--image 누적)

if images.length > 0:
    endpoint = https://api.openai.com/v1/images/edits
    form = new FormData()
    form.append(model, prompt, n, size, quality, output_format)
    if input_fidelity: form.append('input_fidelity', value)
    for each image path:
        buf = readFileSync(path)
        form.append('image[]', new Blob([buf], { type: mime }), basename)
    fetch(endpoint, { headers: { Authorization }, body: form })   // Content-Type 자동
else:
    endpoint = https://api.openai.com/v1/images/generations
    body = 기존 JSON 경로 (변경 없음)

// 공유: 응답 → data[].b64_json → outPaths(--out, --n) 저장  (현 162-170행 그대로)
```

MIME 추정: 확장자 기반 작은 맵(`.png`→`image/png`, `.jpg`/`.jpeg`→`image/jpeg`, `.webp`→`image/webp`), 미상은 `application/octet-stream`.

## 7. 검증 / dry-run

- 각 `--image` 경로에 `existsSync` 검사 — 없으면 명확한 메시지로 즉시 실패(`die`).
- `--input-fidelity`는 `high`/`low` 외 값이면 실패.
- `--dry-run`: 이미지가 있으면 `POST /edits`, 첨부 이미지 경로·개수, 페이로드 미리보기(프롬프트 80자 절단)를 출력. 이미지 없으면 기존 `/generations` 미리보기. **키 불필요 유지.**

## 8. 에러 처리

기존 `die(msg, code)` 스타일 유지. 경계(이미지 파일 누락, 잘못된 fidelity 값)에서 빠르게 실패. API 오류·타임아웃·JSON 파싱 실패 처리는 현행 그대로 두 경로 공유.

## 9. SKILL.md 갱신

- "사용" 절에 `--image`(반복)·`--input-fidelity` 추가.
- §2 인사이트를 한 줄로 명시: *"레퍼런스/편집 구분은 엔드포인트가 아니라 프롬프트 + `input_fidelity`로 표현 — `--image`가 있으면 edits 엔드포인트로 생성."*
- `--help` 텍스트와 옵션 표에도 두 인자 반영.

## 10. 테스트

`tests/`에 dry-run/검증 기반 테스트 추가 (실제 API 호출 없음):
- (a) `--image` 다중 → edits 경로 선택 + 첨부 개수 정확.
- (b) 이미지 없음 → generations 경로 유지 (회귀 가드).
- (c) 존재하지 않는 `--image` 경로 → 비0 종료로 실패.
- (d) 잘못된 `--input-fidelity` 값 → 실패.
- (e) `--input-fidelity` 미지정 → 페이로드에 키 없음.

## 11. 영향 범위

- 변경: `skills/image-gen/scripts/image-gen.mjs`, `skills/image-gen/SKILL.md`, `tests/`.
- 호출자(`design-brand-kit` 등) 변경 없음 — 기존 텍스트→이미지 호출은 그대로 동작.
- Codex 번들: 스킬 수정 후 `npm run sync`로 `plugins/personal/` 재생성 필요 (로컬 생성물, 커밋 안 함).
