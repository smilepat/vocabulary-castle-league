# REPO_OPS.md — 이 저장소의 작업 규율

> **정본은 여기가 아니다.** 멀티 PC 운영 규약의 SSoT는 별도 거버넌스 저장소
> **[smilepat/repo-ops-system](https://github.com/smilepat/repo-ops-system)** 이다.
> 이 파일은 그 규약을 저장소 안에서 상기시키는 **요약 + 로컬 규칙**일 뿐이며,
> 내용이 어긋나면 **언제나 repo-ops-system 쪽이 이긴다.**
>
> | 알고 싶은 것 | 정본 문서 |
> |---|---|
> | 멀티 PC 규약 (lane · WIP · 모델 라우팅) | `MULTI_PC_OPS.md` |
> | STATUS.md 형식 | `templates/STATUS.template.md` |
> | PC에 스캐너·훅 설치 | `docs/multi-pc-setup.md` |
> | 레포 분류·명명·라이프사이클 | `REPO_POLICY.md` · `REPO_CLASSIFICATION_RULE.md` |
> | 지금 뭘 밀고 있나 | `PRIORITY.md` · <https://project-dashboard-drab.vercel.app> |
>
> 절차를 여기 복사해 적지 않는다. 사본이 갈라지면 그 자체가 사고다.

## 0. 우선순위

1. **repo-ops-system** — 거버넌스 SSoT
2. 이 저장소의 `CLAUDE.md` — 프로젝트 고유 규칙
3. 이 파일 → `STATUS.md` / `HANDOFF.md` / `docs/`
4. 각 PC의 로컬 설정·메모리(`~/.claude/**`) — **항상 최하위.** 어긋나면 저장소를
   따르고, 어긋났다는 사실을 사용자에게 알린다.

## 1. 세션 시작

1. `git pull --ff-only` — 충돌하면 임의로 merge/rebase하지 말고 보고한다.
2. `STATUS.md`를 읽는다. **`pc:` 필드는 소유권 lock이다** — 값이 다른 PC 이름이면
   그 PC가 이 저장소를 쥐고 있다는 뜻이다. 여기서 작업하려면 **먼저 `pc:`를 이 PC로
   바꿔 push**한 뒤 시작한다. 한 저장소는 한 시점에 한 PC.
3. 깊은 맥락이 필요하면 `HANDOFF.md` / `AGENTS.md` / `docs/`.

## 2. 작업 중

- **작업 하나가 끝날 때마다 즉시 commit + push.** 모아서 커밋하지 않는다.
- 커밋 메시지: `feat:/fix:/refactor:/docs:/test:/chore:` + 한 줄 요약.
- 커밋 전 그 저장소의 검증을 돌린다(`npm test`, 타입체크, 빌드 등 있는 것).
- `main`에 직접 커밋해도 된다 — 1인 작업이다.
- 미완성이어도 세션이 끝나면 `wip/<주제>` 브랜치로라도 push한다.

## 3. 세션 종료 전

`STATUS.md`의 `updated` · `pc` · `progress` · 체크리스트 · 다음 할 일을 갱신하고
commit + push. 구조·아키텍처가 바뀌었으면 `HANDOFF.md`도.

**push하지 않은 작업은 다른 PC에서 존재하지 않는 것과 같다.** 이 저장소들은
repo-ops-system의 야간 머신 스캔이 감시하며, 미커밋·미푸시는 다음 날 digest에
적신호로 올라온다.

## 4. 자동 점검

- **공식 훅** `hooks/session-status.mjs` (repo-ops-system) — 세션 시작 시 전역
  digest(다른 PC의 미저장 작업, git 관리 밖 폴더, 정체 프로젝트)와 지금 연 저장소의
  미커밋·미푸시를 띄운다. 설치는 `docs/multi-pc-setup.md`.
- **로컬 보조** `scripts/repo-ops-check.ps1` — 공식 훅이 보지 않는 것만 본다:
  `CLAUDE.md`의 `@REPO_OPS.md` 임포트 · git 신원 · `STATUS.md`의 최신성(마지막 커밋
  날짜와 비교)과 `pc:` lock 불일치. 세션 **종료(Stop)** 시점에 돈다.

문제가 없으면 둘 다 아무 것도 출력하지 않는다.

## 5. PC 차이에서 오는 주의점

- git이 PATH에 없는 PC가 있다 → `& "C:\Program Files\Git\cmd\git.exe"`.
- Windows PowerShell 5.1에는 `&&` / `||`가 없다 → `A; if ($?) { B }`.
- Node가 포터블로 설치된 PC가 있다(예: `C:\Users\eltko\nodejs`) → `npm`이 안 잡히면
  전체 경로로 호출한다.
- PowerShell 스크립트는 **UTF-8 BOM**으로 저장한다. BOM이 없으면 5.1이 한글을
  ANSI로 읽어 파싱에 실패한다.
