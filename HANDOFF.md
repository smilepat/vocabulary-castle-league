# HANDOFF — Vocabulary Castle League

> 작업 인수인계 문서. 이 저장소의 현재 상태·구조·남은 일·제약을 한 곳에 정리한다.
> 최종 업데이트: 2026-07-25

---

## 1. 프로젝트 한눈에

- **무엇:** 4인 협동 어휘 학습 게임. 각자 **서로 다른 단서**(뜻·형태·예문·어원)를 나눠 갖고 한 기기를 돌려 보며(패스앤플레이) 말로 조합해 단어를 맞히는 **정보차(Information-Gap)** 방식. 테마 = "학교대항 어휘성 공략전".
- **저장소:** https://github.com/smilepat/vocabulary-castle-league (Public)
- **로컬 경로:** `C:\Users\eltko\vocabulary-castle-league`
- **실행:** `index.html` 더블클릭 (순수 정적, 빌드/서버 불필요). GitHub Pages 배포 호환.
- **출신:** 원래 `smilepat/mindwrite` 안의 `castle.html`이었고, 독립 저장소로 분리됨(원격 세션에서 파일 3종 최초 push).

## 2. 저장소 구조

```
vocabulary-castle-league/
├── index.html            # 게임 본체 (HTML/CSS/JS 단일 파일, 화면 상태 머신)
├── data/words.js         # ★ 콘텐츠 데이터 (단어 뱅크 + 지문). 문항 추가는 여기만 편집
├── README.md             # 게임 소개
├── LICENSE               # Proprietary
├── DEVELOPMENT_PLAN.md   # Fable 5 작성 발전 계획 (Phase 0~4)
├── MARKET_FIT.md         # 시장 적합성 전략 (숏폼 세대 대응, 트렌드 반영)
└── HANDOFF.md            # (이 문서)
```

## 3. 지금까지 한 일 (커밋 순)

| 커밋 | 내용 |
|---|---|
| `0c0fb57` | 초기 게임 (데모: 8단어 하드코딩, 1회 선형 시나리오) |
| `c714792` | docs: 발전 계획 (Phase 0~4 로드맵) |
| `037d948` | docs: 시장 적합성 전략 |
| `6b3f4e8` | **refactor: 콘텐츠 엔진** — 하드코딩 상수 → `data/words.js` 분리, 단서 자동 생성 |
| `901a651` | **feat P2: 매판 랜덤 런** — 자물쇠 단어를 매판 랜덤, 연출 데이터 구동 |
| `35bd874` | **feat P1: 지문 마이크로 청크화** — 긴 지문을 문장 단위로 분할 복원 |

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
- **자동 문법검사 불가:** 이 PC에 Node 미설치. 변경 후 반드시 **브라우저에서 한 판 끝까지 플레이**해 확인.
  - 확인 포인트: ①자물쇠 단어 매판 변경 ②왕좌의 칼 "문장 1/3→2/3→3/3" 분할 ③단서·정답 판정·힌트.
- git 실행: 이 PC에서 `git`이 PATH에 없을 수 있음. 전체 경로: `C:\Program Files\Git\cmd\git.exe` (새 터미널에선 PATH 인식됨).

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

## 9. Git / Push 상태 ⚠️

- **로컬 커밋 6개가 origin에 아직 push되지 않음** (이 HANDOFF 커밋 포함 시 7개).
- **인증:** classic PAT를 `C:\Users\eltko\.git-credentials`에 저장해 둠(store 헬퍼용).
- **막힌 지점:** 이 세션의 자동 안전 분류기가 `git config credential.helper store` 및 credential 관련 push를 차단. → 에이전트가 직접 push 불가.
- **push 방법(사용자 터미널):**
  ```powershell
  cd C:\Users\eltko\vocabulary-castle-league
  git config --local credential.helper store   # 최초 1회
  git push -u origin HEAD
  ```
- **보안:** 사용한 PAT는 채팅/파일에 노출됨 → push 후 **GitHub에서 revoke** 하고 필요 시 재발급 권장.

## 10. 열린 결정 사항

- 정적 유지 vs 백엔드 도입 시점 (MARKET_FIT §6, DEVELOPMENT_PLAN §8).
- 어휘 데이터 확보 방식(자체 제작 권장 — 저장소 Proprietary라 CC-SA 데이터 충돌).
- 긴 지문 깊이 유지 정도 vs 완전 캐주얼 전환.
