---
name: librarian
description: kb 지식 베이스(LLM Wiki)에 소스를 입수(ingest)하거나, kb에 질의(query)하거나, kb 무결성을 점검(lint)할 때 사용. "지식베이스에 추가/정리해줘", "kb에서 찾아줘", "kb 점검" 같은 요청에 해당. 사람용 보관함 vault에는 쓰지 않는다.
---

# librarian

## Overview

`kb` 지식 베이스(LLM Wiki)를 운영한다: 입수(ingest) → 목록화 → 교차참조 → 열람(query) → 점검(lint).

이 스킬은 **운영 절차**만 담는다. 페이지 구조·frontmatter·계약은 **vault의 `AGENTS.md`가 단일 진실원천**이다 — 여기서 재기술하지 않고, 매번 읽어 따른다.

## When to use

- **ingest**: 새 소스(파일/URL)를 kb에 정리해 넣을 때.
- **query**: kb에 묻고 출처 인용 답변이 필요할 때.
- **lint**: kb의 모순·고아 페이지·정합성을 점검할 때.
- **쓰지 않음**: 사람용 작업 vault(`보관함`)는 대상이 아니다. 대상은 항상 `LIBRARIAN_VAULT_PATH`가 가리키는 kb다.

## 0. vault 위치 확인 (모든 operation 공통 첫 단계)

이 스킬 디렉터리의 리졸버로 vault 절대경로를 얻는다:

```
node "<이 스킬 디렉터리>/scripts/resolve-vault.mjs"
```

- stdout의 절대경로를 이후 `$VAULT`로 사용한다.
- 종료 코드가 0이 아니면 stderr 안내대로 `.env`에 `LIBRARIAN_VAULT_PATH`를 설정하라고 사용자에게 알리고 **중단**한다. 추측으로 경로를 만들거나 다른 vault(예: 보관함)를 건드리지 않는다.

이어서 `$VAULT/AGENTS.md`를 읽어 페이지 계약을 로드한다.

## 1. ingest — 소스 입수

입력: 메시지 안의 소스 path 또는 URL (자연어로 전달; 형식 인자에 의존하지 않는다).

소스 인자 규칙 (raw 불변):
- path가 `$VAULT/raw/` 안 → 그대로 사용.
- path가 `raw/` 밖이거나 URL → 먼저 `$VAULT/raw/`에 clip·저장 후 사용 (원본 영구 보존).
- 소스 미지정 → `$VAULT/raw/`에서 대응 source 페이지가 없는 미처리 파일을 스캔.

절차:
1. 소스를 읽는다. 이미지가 있으면 직접 보고 핵심을 글로 옮긴다 (vault는 text-only).
2. **triage**: 핵심 takeaway를 사용자와 확인한다 (무인 발사 아님).
3. `$VAULT/sources/`에 요약 페이지를 쓴다 (AGENTS.md의 source 계약).
4. 건드린 `entities/`·`concepts/`·`syntheses/`를 생성·갱신하고 교차링크한다. 새 데이터가 기존 주장과 충돌하면 모순을 표시한다. 고립 노드 금지 — 모든 새 페이지는 최소 1개 outbound wikilink.
5. `$VAULT/index.md`를 갱신하고, `$VAULT/log.md`에 `## [YYYY-MM-DD] ingest | 제목`을 추가한다.
6. **커밋**(아래 커밋 규약).

## 2. query — 질의

1. `$VAULT/index.md`로 관련 페이지를 찾아 읽는다.
2. 출처를 인용해 답한다.
3. 답이 새 비교·연결·분석을 담으면 `$VAULT/syntheses/`나 `concepts/`에 되먹이고 `index`·`log`를 갱신한 뒤 커밋한다.

## 3. lint — 점검

다음을 점검해 리포트한다:
- 모순, 낡은 주장(새 소스가 갱신한 것)
- 고아 페이지(인바운드 링크 0), 누락된 교차링크
- 페이지가 없는 핵심 개념
- `index.md` 정합성

리포트 + 다음에 조사할 질문/소스를 제안한다. 수정을 적용했으면 커밋한다.

## 커밋 규약

- 커밋은 항상 **vault 저장소**에서: `git -C "$VAULT" add -A && git -C "$VAULT" commit -m "<op>: <제목>"`. 플러그인 repo가 아니다.
- 기본은 자동 커밋. 사용자가 원하면 커밋 전 확인으로 전환한다.

## 멀티 에이전트

Claude 도구명을 사용한다. Codex 등 다른 에이전트에서는 동등한 셸/파일 도구로 대응한다 (리졸버 호출은 셸 실행만 필요).
