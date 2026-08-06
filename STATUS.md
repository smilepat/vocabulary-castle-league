---
project: vocabulary-castle-league
status: active
progress: 70
updated: 2026-08-06
pc: LAPTOP-H10A7AH0
---

# vocabulary-castle-league — STATUS

## 🎯 한 줄 상태

4인이 **서로 다른 단서**를 나눠 갖고 말로 조합해 어휘성을 공략하는 **정보차(Information-Gap)
협동 어휘 게임**. 빌드·서버 없는 **단일 HTML**(`index.html` + `data/words.js`)로 동작한다.
1차 MVP 완성 — 전 구간(등록 → 정보차 문제 → 성문 정찰·선택 → 자물쇠 2개 → 왕좌의 칼
지문 복원 → 성 점령·순위표)이 **브라우저 자동 플레이스루로 완주 검증됨**(2026-07-27).
남은 건 콘텐츠 규모(현재 단어 8·지문 1)와 실제 교실 투입.

## 📊 진행 체크리스트

- [x] 게임 루프 전 구간 — entry → briefing → puzzle → gates → locks → gateOpen → throne → victory
- [x] 4인 역할 순환 + 패스앤플레이(핫시트) 진행
- [x] 성문 5개 정찰(망원경) · 자물쇠 수 노출 · 선택 전략
- [x] 왕좌의 칼 — 수능형 지문 6빈칸을 **문장 단위로 쪼개** 협력 복원 (P1)
- [x] 로그라이크 랜덤 런 + 데이터 기반 잠금 해제 연출 (P2)
- [x] 순위표(localStorage, 외부 전송 없음)
- [x] 콘텐츠 분리 — `data/words.js`만 편집하면 문항 추가·수정 가능
- [x] **검증 도구**(2026-07-27) — `npm test`(무의존 콘텐츠 계약) · `npm run test:e2e`(브라우저 완주)
- [x] **멀티 PC 인수인계 규율 성문화**(2026-08-01) — `CLAUDE.md`에 세션 시작 pull·작업마다 push·종료 전 STATUS.md 갱신 규칙 명시
- [x] **규율을 저장소 공용으로 분리**(2026-08-06) — [REPO_OPS.md](REPO_OPS.md)로 떼어내
      `restoration-reader`·`intuitive-relation-sketching`과 **동일 사본** 공유. `CLAUDE.md`는
      `@REPO_OPS.md`를 임포트하고 이 저장소 고유 규칙만 남김. **저장소 문서가 각 PC의 로컬
      메모리·설정보다 항상 우선**임을 REPO_OPS 0절에 명시
- [ ] **콘텐츠 확충** — 현재 단어 8개·지문 1개. 라운드 반복에 필요한 최소 규모 미달
- [ ] 실제 교실 1회 투입 · 관찰
- [ ] (선택) 4인 실시간 멀티 — 서버 필요, 현재는 패스앤플레이로 대체

## ⏭️ 다음에 할 일 (Next Actions)

1. **콘텐츠 확충** — `data/words.js`에 단어 추가. 편집 후 `npm test`로 계약 위반을 먼저 잡는다
   (철자 조각↔정답 불일치, 예문에 정답 노출, accept 누락, chunks 빈칸 커버리지 등).
2. **교실 투입 전 점검** — `npm run serve` 후 `npm run test:e2e`로 완주 확인.
3. GitHub Pages 공개 여부 결정(README에 절차 있음. 공개해도 기록은 기기 로컬에만 남는다).

## 🤔 결정 대기 (Decisions Needed)

- **콘텐츠 목표 규모** — 한 차시에 몇 라운드를 돌릴지에 따라 필요한 단어 수가 정해진다
  (라운드당 정보차 1 + 자물쇠 2~3 소모).
- **정찰 전 성문 선택 허용 여부** — 지금은 망원경을 쓰기 전에도 문을 누를 수 있고,
  자물쇠 5개짜리를 밟으면 시간 페널티 +20초를 먹는다. 위험/보상 설계로 의도한 것이면 그대로,
  아니면 정찰 전 클릭을 막는 편이 교실에서 덜 억울하다.

## 🚀 배포

- 로컬: `index.html` 더블클릭 (무빌드·무설치)
- GitHub Pages: Settings → Pages → `main` / `/root` (README 참조)
- 기록은 **이 기기 localStorage에만** 저장 · 외부 전송 없음

## 🔗 Claude Code 재개 프롬프트

"HANDOFF.md 읽고 vocabulary-castle-league 이어서 하자"
