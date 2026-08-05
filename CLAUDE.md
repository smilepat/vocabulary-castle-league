@REPO_OPS.md

# CLAUDE.md — vocabulary-castle-league

멀티 PC 작업 규율은 위 **[REPO_OPS.md](REPO_OPS.md)** 에 있다 (세 저장소 공용).
아래는 이 저장소에만 해당하는 사항이다.

## 세션 시작 시 읽을 문서

- **[STATUS.md](STATUS.md)** — 지금 상태·진행률·다음 할 일 (project-dashboard).
- **[HANDOFF.md](HANDOFF.md)** — 구조·아키텍처·제약·git 운영.

## 이 저장소만의 규칙

- 콘텐츠(`data/words.js`) 수정 후에는 `npm test`로 계약 위반을 먼저 잡는다.

## 빠른 사실

- 순수 정적: `index.html` + `data/words.js` (빌드/서버 불필요, 더블클릭 실행).
- 문항 추가 = `data/words.js`만 편집. 검증: `npm test` / 완주: `npm run test:e2e`.
- git이 PATH에 없는 PC가 있음 → `& "C:\Program Files\Git\cmd\git.exe"` 전체 경로 사용.
- 원격: https://github.com/smilepat/vocabulary-castle-league
