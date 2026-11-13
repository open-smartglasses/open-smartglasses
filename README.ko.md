# Open Smartglasses

스마트글래스 앱의 설계 규칙과, 그 규칙을 검사하는 도구. 브랜드를 가리지 않는다.

작은 안경 화면용 앱을 만드는 사람과 그 사람의 코딩 에이전트를 위한 프로젝트다.

[English](./README.md) · 한국어

**상태:** 개발 중. lint는 소스에서 실행할 수 있고, npm에는 아직 올리지 않았다.

## lint 써 보기

Meta Ray-Ban Display 웹 앱과 Even Hub로 만든 Even G2 앱을 검사한다. Node 20 이상과 Chrome이 필요하다.

```bash
git clone https://github.com/open-smartglasses/open-smartglasses
cd open-smartglasses && npm install
node packages/lint/bin/osg-lint.js https://your-app.example
node packages/lint/bin/osg-lint.js https://your-app.example --device even-g2
```

```
error  text/min-size  13 text node(s) below the 16px minimum for Meta Ray-Ban Display.
       vendor rule, grade: docs, https://wearables.developer.meta.com/docs/...
       - 11.4px  "World time"  div.row > div.row-main > div.row-sub
```

결과마다 기준의 출처가 붙는다. 벤더 규칙, 벤더 지침에서 유도한 값, 프로젝트 규칙 중 하나다. `--json`을 붙이면 기계가 읽는 형식으로 나온다. error 등급 규칙에 걸리면 종료 코드가 1이다.

Meta Ray-Ban Display는 첫 화면을 렌더링해 글자, 색, 레이아웃, 입력 규칙 15개를 돌린다. Even G2는 Even 호스트를 대신해 앱이 만드는 페이지를 기록하고, 그 페이지의 제한을 보는 규칙 9개를 돌린다. 규칙마다 설명과 출처는 [지침](./guidelines)에 있다(영어).

## 코딩 에이전트와 쓰기

[`skills/hud-design`](./skills/hud-design)과 [`skills/hud-review`](./skills/hud-review)를 에이전트의 스킬 폴더에 복사하거나, [`skills/AGENTS.md`](./skills/AGENTS.md)를 프로젝트의 `AGENTS.md`에 붙인다. 앞의 것은 에이전트가 화면을 쓰기 전에 설계 규칙을 읽게 하고, 뒤의 것은 결과에 lint를 돌리게 한다.

## 왜 필요한가

2026-11-12에 공개된 Ray-Ban Display 웹 앱 249개를 600×600으로 띄워 쟀다. 첫 화면에 글자가 있는 219개 가운데:

- 68%에 Meta 자체 하한인 16px보다 작은 글자가 있다.
- 본문 글자가 시야각 0.6° 이상인 앱은 4%다. 0.6°는 Google이 디스플레이 안경에 제시한 최소 크기다.

본문 글자 크기의 중앙값은 웹 기본값인 16px이었다. 열린 앱 전체로 보면 53%가 뷰포트 너비를 600px로 고정한다. Meta 레이아웃 가이드가 하지 말라고 한 방식이다.

## 구성

| 부분 | 내용 |
|---|---|
| **[지침](./guidelines)** | 글자 가독성, additive·단색 디스플레이의 색, 1차원 입력, 화면당 정보량, 프라이버시. 각도 크기·톤·초 단위로 적어 기기가 달라도 그대로 쓴다. |
| **[기기 프로파일](./data)** | 기기별 디스플레이·입력·런타임 사실. Meta Ray-Ban Display, Even G2, Android XR이 있다. 사실마다 출처, 확인한 날짜, `unknown`부터 `hardware`까지의 등급이 붙는다. |
| **lint** | 앱을 headless로 렌더링해 스크린샷을 지침에 맞춰 검사한다. 구조 검사는 런타임마다 어댑터 하나로 돈다. |
| **[에이전트 스킬](./skills)** | 모든 플랫폼 공통인 `hud-design`·`hud-review`, 플랫폼별 짧은 노트, `AGENTS.md` 블록. |
| **평가** | 렌더링된 결과로 채점하는 과제. 스킬이 있을 때와 없을 때를 비교한다. |

## 플랫폼

| 플랫폼 | 런타임 | 첫 릴리스 |
|---|---|---|
| Meta Ray-Ban Display | Web Apps | 지침, 프로파일, lint, 스킬 |
| Even Realities G2 | Even Hub | 지침, 프로파일, lint, 스킬 |
| Android XR 디스플레이 안경 | Jetpack Compose Glimmer | 프로파일 |
| Rokid, MentraOS | | 프로파일 |

## 다루지 않는 것

- 브랜드를 가로지르는 런타임이나 UI 프레임워크
- 컴포넌트 라이브러리, 포커스 엔진
- 벤더 SDK 문서를 다시 쓴 것
- 시뮬레이터, 스캐폴더

이런 것은 벤더가 자기 기기용으로 낸다.

## 로드맵

1. **공통 층** — lint 코어와 DOM 어댑터, 지침, 사실 스키마, 기기 프로파일, 공통 스킬.
2. **두 번째 런타임** — Even Hub 어댑터, 플랫폼 노트, 두 플랫폼에서 첫 평가.
3. **실기기 검증** — 기기에서 실측해 사실을 `hardware` 등급으로 올린다.

## 라이선스

[MIT](./LICENSE)
