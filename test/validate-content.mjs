// =========================================================================
// data/words.js 계약 검사 — 무의존(node만) · `npm test`
//
// README 는 "문항 추가·수정은 data/words.js만 편집하면 됩니다"라고 안내한다.
// 그 말이 참이려면, 잘못 편집했을 때 게임을 열기 전에 알려 줘야 한다.
// 여기서는 게임 코드가 실제로 읽는 필드만 검사한다(있으면 좋은 것 말고).
//
// 실행: npm test   또는   node test/validate-content.mjs
// =========================================================================
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// data/words.js 는 브라우저용이라 window 에 붙인다. 같은 방식으로 읽는다.
const win = {}
new Function("window", readFileSync(resolve(root, "data/words.js"), "utf8"))(win)
const data = win.VCL_DATA

const problems = []
const warn = []
const fail = (m) => problems.push(m)

// ---------- 최상위 ----------
if (!data) fail("window.VCL_DATA 가 없습니다.")
if (!Array.isArray(data?.words)) fail("VCL_DATA.words 가 배열이 아닙니다.")
if (!Array.isArray(data?.passages)) fail("VCL_DATA.passages 가 배열이 아닙니다.")
if (problems.length) {
  console.error("✗ 치명적:", problems.join(" / "))
  process.exit(1)
}

// ---------- 단어 ----------
// 게임이 읽는 필드: id, answer, accept?, ko, def_ko, example, morphemes{parts,gloss?}
const seen = new Set()
data.words.forEach((w, i) => {
  const at = `words[${i}]${w?.id ? `(${w.id})` : ""}`
  if (!w?.id) fail(`${at}: id 없음`)
  else if (seen.has(w.id)) fail(`${at}: id 중복`)
  else seen.add(w.id)

  if (typeof w?.answer !== "string" || !w.answer.trim()) fail(`${at}: answer 없음`)
  if (w.answer && !/^[a-zA-Z][a-zA-Z\s'-]*$/.test(w.answer)) {
    fail(`${at}: answer 가 영어 단어 형식이 아님 — "${w.answer}"`)
  }
  if (w.accept !== undefined && !Array.isArray(w.accept)) fail(`${at}: accept 는 배열이어야 함`)
  if (Array.isArray(w.accept) && !w.accept.includes(w.answer)) {
    // 게임은 accept 로 채점한다. answer 가 빠져 있으면 정답을 써도 틀린다.
    fail(`${at}: accept 에 answer("${w.answer}")가 빠져 있음`)
  }

  if (!Array.isArray(w?.ko) || w.ko.length === 0) fail(`${at}: ko(한국어 뜻) 없음`)
  if (typeof w?.def_ko !== "string" || !w.def_ko.trim()) fail(`${at}: def_ko 없음`)

  // 예문은 빈칸(______)이 있어야 단서로 쓸모가 있다
  if (typeof w?.example !== "string" || !w.example.trim()) fail(`${at}: example 없음`)
  else if (!/_{3,}/.test(w.example)) warn.push(`${at}: example 에 빈칸(______)이 없음`)
  else if (new RegExp(`\\b${w.answer}\\b`, "i").test(w.example)) {
    // 예문에 정답이 그대로 있으면 정보차가 성립하지 않는다
    fail(`${at}: example 에 정답 "${w.answer}" 가 그대로 노출됨`)
  }

  const parts = w?.morphemes?.parts
  if (!Array.isArray(parts) || parts.length === 0) fail(`${at}: morphemes.parts 없음`)
  else {
    // 조각에는 뜻풀이가 괄호로 붙는다: "ob(맞서)" · "sta(서다)" · "cle"
    // 괄호를 걷어내고 이어 붙이면 정답 철자가 나와야 한다 — 단서 화면이 이 전제로 만들어져 있다.
    const spelled = parts.map((p) => String(p).replace(/\([^)]*\)/g, "")).join("")
    if (spelled.toLowerCase() !== String(w.answer ?? "").toLowerCase()) {
      fail(`${at}: 철자 조각을 이으면 "${spelled}" — answer "${w.answer}" 와 다름`)
    }
  }
})

// ---------- 지문 ----------
data.passages.forEach((p, pi) => {
  const at = `passages[${pi}]${p?.id ? `(${p.id})` : ""}`
  if (!Array.isArray(p?.blanks) || p.blanks.length === 0) return fail(`${at}: blanks 없음`)
  if (!Array.isArray(p?.parts)) return fail(`${at}: parts 없음`)
  if (!Array.isArray(p?.chunks) || p.chunks.length === 0) return fail(`${at}: chunks 없음`)

  // parts 는 빈칸 사이의 조각이므로 항상 blanks + 1 개
  if (p.parts.length !== p.blanks.length + 1) {
    fail(`${at}: parts ${p.parts.length}개 ≠ blanks ${p.blanks.length}개 + 1`)
  }

  p.blanks.forEach((b, bi) => {
    const bat = `${at}.blanks[${bi}]`
    if (typeof b?.answer !== "string" || !b.answer.trim()) fail(`${bat}: answer 없음`)
    if (!Array.isArray(b?.accept) || !b.accept.includes(b.answer)) {
      fail(`${bat}: accept 에 answer("${b.answer}")가 빠져 있음`)
    }
    if (!b?.no) warn.push(`${bat}: no(①②…) 표기 없음`)
  })

  // 문장 단위 복원(chunks)의 blankIdx 가 blanks 를 정확히 한 번씩 덮어야 한다
  const covered = p.chunks.flatMap((c) => c.blankIdx ?? [])
  const expected = p.blanks.map((_, i) => i)
  const missing = expected.filter((i) => !covered.includes(i))
  const dup = covered.filter((v, i) => covered.indexOf(v) !== i)
  const oob = covered.filter((i) => i < 0 || i >= p.blanks.length)
  if (missing.length) fail(`${at}: chunks 가 빈칸 ${missing.join(",")} 을 다루지 않음 — 그 빈칸은 영원히 안 나옴`)
  if (dup.length) fail(`${at}: chunks 에 빈칸 ${[...new Set(dup)].join(",")} 이 중복 등장`)
  if (oob.length) fail(`${at}: chunks 의 blankIdx ${oob.join(",")} 가 범위 밖`)

  p.chunks.forEach((c, ci) => {
    const n = (c.blankIdx ?? []).length
    if (!Array.isArray(c?.parts) || c.parts.length !== n + 1) {
      fail(`${at}.chunks[${ci}]: parts ${c?.parts?.length ?? 0}개 ≠ 빈칸 ${n}개 + 1`)
    }
  })

  // 4인 협동이므로 단서는 역할 수(4)만큼 있어야 한다
  const clueKeys = Object.keys(p.clues ?? {})
  if (clueKeys.length !== 4) {
    fail(`${at}: clues 가 ${clueKeys.length}개 — 4인 역할에 맞춰 4개여야 함`)
  }
})

// ---------- 게임 진행 가능성 ----------
// 정보차 문제(1) + 자물쇠(최대 3) 를 뽑을 만큼 단어가 있어야 한다
if (data.words.length < 4) {
  fail(`단어가 ${data.words.length}개 — 망원경 1 + 자물쇠 최대 3 을 채우려면 4개 이상 필요`)
}

// ---------- 결과 ----------
console.log(`검사 대상: 단어 ${data.words.length}개 · 지문 ${data.passages.length}개 ` +
  `(빈칸 ${data.passages.reduce((s, p) => s + (p.blanks?.length ?? 0), 0)}개)`)
for (const w of warn) console.log(`  ⚠ ${w}`)

if (problems.length) {
  console.error(`\n✗ 실패 ${problems.length}건`)
  problems.forEach((p) => console.error(`  · ${p}`))
  process.exit(1)
}
console.log(`\n✓ 통과${warn.length ? ` (경고 ${warn.length}건)` : ""}`)
