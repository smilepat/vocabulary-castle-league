/* =========================================================================
   Vocabulary Castle League — 콘텐츠 데이터 (Phase 1)
   -------------------------------------------------------------------------
   ▸ 문항(단어·지문)을 추가·수정하려면 "이 파일만" 편집하세요. 코드(index.html)
     는 건드릴 필요가 없습니다.
   ▸ index.html을 더블클릭(file://)으로 실행하는 것을 지원하기 위해,
     fetch(JSON) 대신 전역 변수(window.VCL_DATA)로 데이터를 싣습니다.
     (file:// 에서는 fetch/모듈 import가 막히지만 <script src>는 동작합니다.)

   단어 레코드 스키마
   ------------------
   {
     id:       고유 식별자 (영문 소문자)             — 필수
     answer:   정답 표제어                           — 필수
     accept:   추가 허용 답 배열 (생략 시 [answer])  — 선택
     pos:      품사 ('n','v','adj' 등)               — 선택
     ko:       한국어 뜻 배열                        — 선택
     def_ko:   정의(뜻풀이) 문장 — [뜻] 단서로 노출  — 필수
     example:  예문 (정답 자리는 ______ 로 표기)     — 필수
     morphemes:{ label, parts:[...], gloss }         — 필수
               label = '어원 조각' 또는 '철자 조각'
     level:    난이도 1~5                            — 선택(적응형 난이도용)
     tags:     분류 태그 배열                        — 선택
   }
   first(첫 글자)·length(글자 수)는 코드가 answer에서 자동 계산합니다.
   ========================================================================= */
(function (global) {
  'use strict';

  /* ---------- 단어 뱅크 ---------- */
  const WORDS = [
    {
      id: 'binoculars', answer: 'binoculars', pos: 'n',
      ko: ['망원경', '쌍안경'],
      def_ko: '멀리 있는 물체를 두 눈으로 확대해 보는 도구',
      example: 'The guard used the ______ to watch the distant gate.',
      morphemes: { label: '철자 조각', parts: ['bin', 'ocular', 's'], gloss: 'ocular = 눈과 관련된' },
      level: 2, tags: ['도구'],
    },
    {
      id: 'obstacle', answer: 'obstacle', pos: 'n',
      ko: ['장애물'],
      def_ko: '길을 가로막아 나아가지 못하게 하는 것 — 장애물',
      example: 'A huge rock was an ______ on the road to the castle.',
      morphemes: { label: '어원 조각', parts: ['ob(맞서)', 'sta(서다)', 'cle'], gloss: '길 앞에 "맞서 서 있는" 것!' },
      level: 3, tags: ['수능', 'movement'],
    },
    {
      id: 'approach', answer: 'approach', pos: 'v',
      ko: ['접근하다', '다가가다'],
      def_ko: '가까이 다가가다, 접근하다',
      example: 'Be quiet as we ______ the castle gate at night.',
      morphemes: { label: '어원 조각', parts: ['ap(~쪽으로)', 'proach(가까이)'], gloss: 'proach는 라틴어 prope = "가까운"에서!' },
      level: 3, tags: ['수능', 'movement'],
    },
    {
      id: 'acquire', answer: 'acquire', pos: 'v',
      ko: ['획득하다', '얻다'],
      def_ko: '(지식·기술 등을) 노력하여 얻다·획득하다',
      example: 'Students ______ new words by using them in real sentences.',
      morphemes: { label: '어원 조각', parts: ['ac(~로)', 'quire(구하다)'], gloss: 'quire는 라틴어 quaerere = "구하다/찾다" → 찾아서 얻다' },
      level: 3, tags: ['수능', '학습'],
    },
    {
      id: 'interpret', answer: 'interpret', pos: 'v',
      ko: ['해석하다', '이해하다'],
      def_ko: '뜻을 이해하고 풀이하다·해석하다',
      example: 'It is hard to ______ the message without enough clues.',
      morphemes: { label: '어원 조각', parts: ['inter(사이)', 'pret(풀이하다)'], gloss: '사이를 풀이하다 → 해석하다' },
      level: 3, tags: ['수능'],
    },
    {
      id: 'evidence', answer: 'evidence', pos: 'n',
      ko: ['증거'],
      def_ko: '어떤 사실을 뒷받침하는 증거',
      example: 'The detective looked for ______ at the castle gate.',
      morphemes: { label: '어원 조각', parts: ['e(밖으로)', 'vid(보다)', 'ence'], gloss: 'vid = 보다(video) → 밖으로 드러나 보이는 것' },
      level: 3, tags: ['수능'],
    },
    {
      id: 'perspectives', answer: 'perspectives', accept: ['perspectives', 'perspective'], pos: 'n',
      ko: ['관점', '시각'],
      def_ko: '사물을 바라보는 관점·시각',
      example: 'We should listen to different ______ before deciding.',
      morphemes: { label: '어원 조각', parts: ['per(통하여)', 'spect(보다)', 'ives'], gloss: 'spect = 보다(inspect) → 통하여 보는 방식 = 관점' },
      level: 4, tags: ['수능'],
    },
    {
      id: 'significant', answer: 'significant', pos: 'adj',
      ko: ['중요한', '의미 있는'],
      def_ko: '중요한·의미 있는',
      example: 'Only a few details were truly ______ to the plan.',
      morphemes: { label: '어원 조각', parts: ['sign(표시)', 'ific', 'ant'], gloss: 'sign(표시)이 담긴 → 의미 있는/중요한' },
      level: 4, tags: ['수능'],
    },
  ];

  /* ---------- 지문 뱅크 (왕좌의 칼 · 수능형 빈칸 복원) ----------
     parts[i] 뒤에 blanks[i]가 끼어드는 구조 (parts 7개 + blanks 6개).
     clues[역할index] = 해당 역할이 보는 지문 단서(HTML). */
  const PASSAGES = [
    {
      id: 'throne-learning',
      parts: [
        'A difficult problem is not always an ', ' to learning. Students may ',
        ' deeper knowledge when they try to ', ' incomplete information. They must compare ',
        ', listen to different ', ', and decide which details are ', '.',
      ],
      blanks: [
        { no: '①', answer: 'obstacle',     accept: ['obstacle'],                   ko: '장애물' },
        { no: '②', answer: 'acquire',      accept: ['acquire'],                    ko: '획득하다·얻다' },
        { no: '③', answer: 'interpret',    accept: ['interpret'],                  ko: '이해하고 해석하다' },
        { no: '④', answer: 'evidence',     accept: ['evidence'],                   ko: '증거' },
        { no: '⑤', answer: 'perspectives', accept: ['perspectives', 'perspective'], ko: '관점' },
        { no: '⑥', answer: 'significant',  accept: ['significant'],                ko: '중요한·의미 있는' },
      ],
      clues: {
        1: `핵심 어휘 의미:<br>
      · 빈칸 ① : 뜻 <b>'장애물'</b> (첫 글자 <b>o</b>, <b>8글자</b>)<br>
      · 빈칸 ② : 뜻 <b>'(지식·기술을) 획득하다·얻다'</b> (첫 글자 <b>a</b>)`,
        0: `첫 문장 & 중심 생각 & 논리 흐름:<br>
      · 지문의 중심 생각: <b>"어려운 문제가 늘 학습의 [①]인 것은 아니다 — 오히려 배움의 기회다"</b><br>
      · 빈칸 ⑤ : '서로 다른 <b>[관점]</b>들을 듣는다' (첫 글자 <b>p</b>, 보통 <b>복수형</b>)`,
        3: `어원 & 근거:<br>
      · 빈칸 ③ : '불완전한 정보를 [&nbsp;&nbsp;&nbsp;]하려 할 때' — <b>inter-</b> 로 시작<br>
      <span style="font-size:12px;color:var(--sub);">(inter=사이, pret=풀이하다 → "사이를 풀이하다 = 해석하다")</span><br>
      · 빈칸 ④ : '[&nbsp;&nbsp;&nbsp;]를 비교한다' — 뜻 <b>'증거'</b> (<b>evi-</b> 로 시작)`,
        2: `마지막 문장 & 결론:<br>
      · 빈칸 ⑥ : "어떤 세부사항이 [&nbsp;&nbsp;&nbsp;]한지 결정한다" — 뜻 <b>'중요한·의미 있는'</b>
      (첫 글자 <b>s</b>, 안에 <b>sign</b> 이 보임)<br>
      <span style="font-size:12px;color:var(--sub);">(그리고 여섯 빈칸의 최종 입력도 기록자의 몫!)</span>`,
      },
    },
  ];

  global.VCL_DATA = { words: WORDS, passages: PASSAGES };
})(window);
