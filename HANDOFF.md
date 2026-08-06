# HANDOFF — Vocabulary Castle League

> 작업 인수인계 문서. 이 저장소의 현재 상태·구조·남은 일·제약을 한 곳에 정리한다.
> 최종 업데이트: **2026-08-06**
>
> 세션 시작 규율은 [REPO_OPS.md](REPO_OPS.md)(세 저장소 공용) + [CLAUDE.md](CLAUDE.md)(이
> 저장소 고유), 지금 진행 상황은 [STATUS.md](STATUS.md).
> 이 문서는 **구조·아키텍처·제약**을 다룬다.
>
> 저장소 문서는 각 PC의 로컬 메모리·설정보다 **항상 우선**한다(REPO_OPS 0절).

---

## 1. 프로젝트 한눈에

- **무엇:** 4인 협동 어휘 학습 게임. 각자 **서로 다른 단서**(뜻·형태·예문·어원)를 나눠 갖고 한 기기를 돌려 보며(패스앤플레이) 말로 조합해 단어를 맞히는 **정보차(Information-Gap)** 방식. 테마 = "학교대항 어휘성 공략전".
- **저장소:** https://github.com/smilepat/vocabulary-castle-league (Public)
- **로컬 경로:** PC마다 다르다. 새 PC에서는 `gh repo clone smilepat/vocabulary-castle-league`.
  (예전 기록: `C:\Users\eltko\vocabulary-castle-league` — 특정 PC 기준이므로 그대로 믿지 말 것)
- **실행:** `index.html` 더블클릭 (순수 정적, 빌드/서버 불필요). GitHub Pages 배포 호환.
- **출신:** 원래 `smilepat/mindwrite` 안의 `castle.html`이었고, 독립 저장소로 분리됨(원격 세션에서 파일 3종 최초 push).

## 2. 저장소 구조

```
vocabulary-castle-league/
├── index.html            # 게임 본체 (HTML/CSS/JS 단일 파일, 화면 상태 머신)
├── data/words.js         # ★ 콘텐츠 데이터 (단어 뱅크 + 지문). 문항 추가는 여기만 편집
├── test/
│   ├── validate-content.mjs  # 콘텐츠 계약 검사 (무의존) — npm test
│   └── playthrough.mjs       # 브라우저 완주 검증 (Playwright) — npm run test:e2e
├── package.json          # 스크립트·devDependency(@playwright/test). 게임 자체는 여전히 무빌드
├── REPO_OPS.md           # ★ 멀티 PC 작업 규율 (세 저장소 공용 정본, 동일 사본)
├── CLAUDE.md             # 이 저장소 고유 규칙 + `@REPO_OPS.md` 임포트
├── STATUS.md             # 지금 진행 상황 (project-dashboard 카드 소스)
├── README.md             # 게임 소개
├── LICENSE               # Proprietary
├── DEVELOPMENT_PLAN.md   # Fable 5 작성 발전 계획 (Phase 0~4)
├── MARKET_FIT.md         # 시장 적합성 전략 (숏폼 세대 대응, 트렌드 반영)
└── HANDOFF.md            # (이 문서)
```

> `package.json` 이 생겼지만 **게임 실행에는 여전히 빌드도 설치도 필요 없다.**
> npm 은 검증 도구 전용이다. `index.html` 더블클릭은 그대로 동작한다.

## 3. 지금까지 한 일 (커밋 순)

| 커밋 | 내용 |
|---|---|
| `0c0fb57` | 초기 게임 (데모: 8단어 하드코딩, 1회 선형 시나리오) |
| `c714792` | docs: 발전 계획 (Phase 0~4 로드맵) |
| `037d948` | docs: 시장 적합성 전략 |
| `6b3f4e8` | **refactor: 콘텐츠 엔진** — 하드코딩 상수 → `data/words.js` 분리, 단서 자동 생성 |
| `901a651` | **feat P2: 매판 랜덤 런** — 자물쇠 단어를 매판 랜덤, 연출 데이터 구동 |
| `35bd874` | **feat P1: 지문 마이크로 청크화** — 긴 지문을 문장 단위로 분할 복원 |
| `f2902db` | docs: 인수인계(HANDOFF) 문서 |
| `9ec04e5` (7/27) | chore: `STATUS.md` 추가 (project-dashboard 카드) |
| `d8754bd` (7/27) | **test: 콘텐츠 계약 검사 + 브라우저 완주 검증** — `npm test` / `npm run test:e2e` 도입 |
| `d2c2a59` (8/01) | **docs: 멀티 PC 인수인계 규율 성문화** — `CLAUDE.md` |

> 위 커밋은 모두 **origin/main에 push 완료**. (이 문서의 이후 수정은 별도 커밋으로 이어짐)
>
> ⚠️ 이 저장소는 **여러 PC에서 번갈아** 작업한다(최근 `LAPTOP-H10A7AH0`). `CLAUDE.md` 규율대로
> 세션 시작에 `git pull --ff-only`, 작업 단위마다 push, 종료 전 `STATUS.md` 갱신.
> **push하지 않은 작업은 다른 PC에서 존재하지 않는 것과 같다.**

## 4. 아키텍처 핵심

- **화면 상태 머신:** `SCREENS[name]` + `go(name, arg)` 라우터. 흐름: `entry → briefing → puzzle(intro) → gates → locksIntro → puzzle(lock)×N → gateOpen → throneIntro → throne → victory`.
- **콘텐츠 엔진 (`data/words.js`):** `window.VCL_DATA = { words:[...], passages:[...] }`.
  - `fetch(JSON)`은 `file://`에서 CORS로 막히므로 **전역 변수(js) 방식** 채택. (스키마·필드 설명은 파일 상단 주석 참조.)
  - `index.html`이 로드 시 `normalizeWord()`로 정규화(첫 글자·글자 수·accept 계산), `buildClues(word)`로 역할별 4단서 자동 생성.
  - 문항 추가 = `data/words.js` 편집만. 코드 수정 불필요.
- **P2 랜덤 런:** `composeRun()`이 매판 단어 뱅크에서 자물쇠 단어를 무작위 추출(`game.run.lockIds`). 인트로(`binoculars`)는 망원경 획득 연출로 고정. `game.solvedWords`에 정복 단어 누적 → 승리 화면 동적 생성.
- **P1 청크 지문:** `passages[].chunks`(명시적 `parts`/`blankIdx`)로 지문을 문장 단위로 분할. 왕좌의 칼 입력 단계가 문장 1개씩 복원되며 완성 문장이 누적.

## 5. 실행·테스트

- 실행: `index.html` 더블클릭 또는 `Start-Process index.html`.

**✅ 2026-07-27부터 자동 검증이 있다** (이전 판의 "자동 문법검사 불가 · Node 미설치"는 더 이상 사실이 아니다):

| 명령 | 하는 일 |
|---|---|
| `npm test` | **콘텐츠 계약 검사** (`test/validate-content.mjs`, 의존성 0). 철자 조각↔정답 불일치, 예문에 정답 노출, `accept` 누락, `chunks` 빈칸 커버리지 등을 잡는다 |
| `npm run test:e2e` | **브라우저 완주 검증** (`test/playthrough.mjs`, Playwright). 전 구간 자동 플레이 |
| `npm run serve` | `python -m http.server 4173` — e2e 전에 띄운다 |

- `data/words.js` 를 고쳤으면 **`npm test` 를 먼저** 돌린다. 계약 위반은 브라우저에서
  플레이하다 뒤늦게 발견하는 것보다 여기서 잡는 게 훨씬 싸다.
- 수동 확인 포인트(여전히 유효): ①자물쇠 단어 매판 변경 ②왕좌의 칼 "문장 1/3→2/3→3/3" 분할
  ③단서·정답 판정·힌트.
- Node 는 `>=18` 필요(`package.json` engines). Node 가 없는 PC라면 게임 실행·수동 플레이는
  그대로 되지만 자동 검증은 못 돌린다.
- git 실행: `git`이 PATH에 없는 PC가 있음. 전체 경로: `C:\Program Files\Git\cmd\git.exe`.

## 6. 시장 전략 요약 (MARKET_FIT.md)

- **핵심 진단:** 타깃(숏폼 세대)이 **긴 글을 기피**(고교생 30.6% "10분+ 긴 글 어려움"). 기존 클라이맥스(긴 수능 지문 복원)가 최대 시장 리스크 → **P1로 문장 단위 분할** 시작.
- **반영 6원칙:** ①마이크로 청크(P1✅) ②5분 랜덤 런(P2✅) ③카드 수집 ④대항·설욕 루프 ⑤연속출석(streak) ⑥15초 카피.
- **해자:** 협동+대항 하이브리드(클래스카드는 개인전). 벤치마크: 클래스카드·Duolingo·Roblox.

## 7. 남은 일 (우선순위)

1. **단어 뱅크 확충** — 현재 8개. 수십~수백 개로. `data/words.js`에 스키마대로 추가(어원·예문은 사람 검수 필요).
2. **오답 복습 루프 / SRS (P4)** — `recordResult(wordId, correct)` + localStorage 이력. 다음 판 선봉에 오답 단어("복수전").
3. **연속출석 streak (P5)** — 일일 원정·복귀 훅.
4. **카드 수집 (P3)** — 정복 단어 컬렉션(과금 가챠 배제).
5. **성문 선택 실질화** — 현재 `pick()`이 3번 문만 정답인 가짜 선택. 실제 난이도-보상 선택으로.
6. **학교대항 실체화 (Phase 3)** — Supabase 등 서버 도입 시 저장 계층 추상화부터.

## 8. 알려진 제약·주의

- `data/words.js`는 **JSON이 아니라 JS**(전역 변수). `file://` 실행 지원 때문. ES 모듈/`fetch` 쓰면 더블클릭 실행이 깨짐.
- 데이터는 **플레인 텍스트 원칙** 권장(HTML은 렌더러가). 사용자 입력엔 `esc()` 적용됨.
- `game.attempts/correct`는 P1 이후 청크 단위로 증가(지문 1편 = 3시도). 정답률 통계 해석 시 유의.

## 9. Git / Push 상태

- **origin/main 최신화 완료** — §3의 커밋 6개(문서·엔진·P1·P2, 마지막 `f2902db`)가 모두 push됨. (이 문서의 §3/§9 갱신 커밋은 그 이후 별도)
- **인증 구성:** repo local `credential.helper=store` + `C:\Users\eltko\.git-credentials`에 자격증명 저장. 실제 인증은 사용자 터미널에서 Git Credential Manager OAuth로 완료(파일에 `gho_` 토큰).
- **이후 push:** 사용자 터미널에서 `git push` 만으로 자동 인증(프롬프트 없음).
  - 새 터미널이면 `git` 바로 인식. 설치 직후 열려 있던 창은 PATH 미갱신 → 전체 경로 사용:
    `& "C:\Program Files\Git\cmd\git.exe" push`
- **에이전트 제약:** 이 세션의 자동 안전 분류기가 credential 관련 config/push를 차단할 수 있음. 그 경우 push는 **사용자 터미널**에서 수행.
- **보안:** 초기에 노출된 classic PAT(`ghp_...`)는 revoke 권장 (GitHub → Settings → Developer settings → Tokens).

## 10. 열린 결정 사항

- 정적 유지 vs 백엔드 도입 시점 (MARKET_FIT §6, DEVELOPMENT_PLAN §8).
- 어휘 데이터 확보 방식(자체 제작 권장 — 저장소 Proprietary라 CC-SA 데이터 충돌).
- 긴 지문 깊이 유지 정도 vs 완전 캐주얼 전환.
