# CLAUDE.md — 멀티 PC 작업 규율

> 이 저장소는 **여러 PC에서 번갈아** 작업한다. 각 PC의 로컬 메모리(`~/.claude`)는
> 동기화되지 않으므로, **PC 간에 공유되는 상태는 오직 이 git 저장소 안의 문서**뿐이다.
> 어느 PC에서 열어도 아래 규율을 그대로 따른다.

## 세션 시작 시 (항상)

1. `git pull --ff-only` — 다른 PC가 밀어둔 작업을 먼저 받는다.
2. **[STATUS.md](STATUS.md)** 읽기 — 지금 상태·진행률·다음 할 일 (project-dashboard).
3. 깊은 맥락이 필요하면 **[HANDOFF.md](HANDOFF.md)** 읽기 — 구조·아키텍처·제약·git 운영.

## 작업 중 (repo-ops 규율)

- **작업(task) 하나가 끝날 때마다 즉시 commit + push.** 여러 작업을 모아 한 번에
  커밋하지 말 것. 사용자가 다른 PC/GitHub에서 진행을 바로 확인하려는 목적.
- 커밋 메시지는 `feat:/fix:/refactor:/docs:/test:/chore:` 접두어 + 한 줄 요약.
- 콘텐츠(`data/words.js`) 수정 후에는 `npm test`로 계약 위반을 먼저 잡는다.

## 세션 종료 전 (다른 PC가 알아보게)

**STATUS.md를 최신화**한다 — 이게 멀티 PC 인수인계의 핵심이다:

- frontmatter: `updated`(오늘 날짜), `pc`(이 PC 이름), 필요시 `progress`(%).
- 진행 체크리스트 `[ ]/[x]`, "다음에 할 일", "결정 대기" 갱신.
- 구조·아키텍처·제약이 바뀌었으면 **HANDOFF.md**도 함께 갱신.

그런 다음 `docs: update status` 등으로 commit + push. **push하지 않은 작업은
다른 PC에서 존재하지 않는 것과 같다.**

## 이 저장소 빠른 사실

- 순수 정적: `index.html` + `data/words.js` (빌드/서버 불필요, 더블클릭 실행).
- 문항 추가 = `data/words.js`만 편집. 검증: `npm test` / 완주: `npm run test:e2e`.
- git이 PATH에 없는 PC가 있음 → `& "C:\Program Files\Git\cmd\git.exe"` 전체 경로 사용.
- 원격: https://github.com/smilepat/vocabulary-castle-league
