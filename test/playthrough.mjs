// =========================================================================
// 브라우저 자동 플레이스루 — 게임을 처음부터 끝까지 실제로 진행해 본다.
//
// 무의존 검사(validate-content.mjs)는 데이터 계약만 본다. 이 스크립트는
// "정말 성을 점령할 수 있는가"를 실제 브라우저로 확인한다.
//
// Playwright 가 필요하다(선택 도구):
//   npm i -D @playwright/test && npx playwright install chromium
//
// 실행:
//   python -m http.server 4173      # 다른 터미널에서 (file:// 은 Playwright 가 막는다)
//   npm run test:e2e
//
// 단계별 스크린샷을 test-shots/ 에 남긴다.
// =========================================================================
import { readFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const URL = process.env.VCL_URL || "http://127.0.0.1:4173/index.html"
const SHOTS = resolve(root, "test-shots")

let chromium
try {
  ({ chromium } = await import("@playwright/test"))
} catch {
  console.error("Playwright 가 없습니다. 이 검사는 선택 도구입니다.")
  console.error("  npm i -D @playwright/test && npx playwright install chromium")
  process.exit(2)
}

// 정답은 데이터에서 읽는다(게임 코드가 읽는 것과 같은 출처).
const win = {}
new Function("window", readFileSync(resolve(root, "data/words.js"), "utf8"))(win)
const WORDS = win.VCL_DATA.words.map((w) => w.answer)
const BLANKS = win.VCL_DATA.passages[0].blanks.map((b) => b.answer)

mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
page.on("pageerror", (e) => errors.push("pageerror: " + e.message))

try {
  await page.goto(URL, { waitUntil: "networkidle" })
} catch {
  console.error(`${URL} 에 접속할 수 없습니다. 먼저 로컬 서버를 띄우세요:  python -m http.server 4173`)
  await browser.close()
  process.exit(2)
}

const stage = page.locator("#stage")
const txt = async () => (await stage.innerText()).replace(/\s+/g, " ").trim()
const WRONG = /꿈쩍도|다시 맞춰|틀렸|아니에요/

// 게임은 매 동작마다 #stage 를 통째로 다시 그린다. 그 사이 요소가 사라지면
// 클릭이 30초를 기다리다 죽는다 — 짧게 시도하고 실패하면 다음 루프에서 다시 본다.
const tryClick = async (loc) => {
  try { await loc.click({ timeout: 4000 }); return true } catch { return false }
}
const tryFill = async (loc, v) => {
  try { await loc.fill(v, { timeout: 4000 }); return true } catch { return false }
}

// ---- 팀 등록 ----
const inputs = stage.locator("input:visible")
const vals = ["한빛중", "TEST01", "1반 원정대", "민수", "지영", "서준", "하윤"]
for (let i = 0; i < (await inputs.count()); i++) await tryFill(inputs.nth(i), vals[i] ?? "테스터")
await page.getByRole("button", { name: /원정대 집결/ }).click()
await page.waitForTimeout(400)

const stages = []
let last = ""
let shot = 0
let blankCursor = 0
let done = false

for (let step = 0; step < 200; step++) {
  const t = await txt()
  const head = t.slice(0, 50)
  if (head !== last) {
    last = head
    stages.push(head)
    await page.screenshot({ path: `${SHOTS}/${String(++shot).padStart(2, "0")}.png`, fullPage: true })
  }
  if (/순위표|리더보드|다시 도전/.test(t)) { done = true; break }

  // ---- 답 입력 ----
  const fields = stage.locator("input:visible, textarea:visible")
  const fc = await fields.count()
  if (fc > 0) {
    const submit = stage.locator("button:visible")
      .filter({ hasText: /제출|확인|열기|해제|복원|뽑/ }).first()
    if (await submit.count()) {
      // 왕좌의 칼: 문장 하나에 빈칸이 여러 개고 문장 전체로만 채점된다.
      // 칸별 시행착오가 불가능하므로 데이터의 정답 순서를 그대로 쓴다.
      if (blankCursor < BLANKS.length && /빈칸/.test(t)) {
        for (let i = 0; i < fc; i++) await tryFill(fields.nth(i), BLANKS[blankCursor + i] ?? "")
        if (!(await tryClick(submit))) continue
        await page.waitForTimeout(240)
        if (!WRONG.test(await txt())) { blankCursor += fc; continue }
      }
      // 정보차 문제·자물쇠: 단어 후보를 하나씩 넣어 본다(8개뿐).
      let solved = false
      for (const cand of WORDS) {
        const f = stage.locator("input:visible, textarea:visible")
        if ((await f.count()) === 0) { solved = true; break }
        if (!(await tryFill(f.first(), cand))) break
        if (!(await tryClick(submit))) break
        await page.waitForTimeout(200)
        if (!WRONG.test(await txt())) { solved = true; break }
      }
      if (solved) continue
    }
  }

  // ---- 성문 선택 ----
  // 반드시 망원경으로 정찰한 뒤 자물쇠가 가장 적은 문을 고른다.
  // 정찰 전에 아무 문이나 누르면 시간 페널티를 먹는다.
  const gates = stage.locator(".gate:visible")
  if (await gates.count()) {
    const labels = await gates.allInnerTexts()
    const known = labels
      .map((l, i) => ({ i, m: l.match(/자물쇠\s*(\d+)\s*개/) }))
      .filter((x) => x.m)
      .map((x) => ({ i: x.i, n: Number(x.m[1]) }))
      .sort((a, b) => a.n - b.n)
    if (known.length) {
      await tryClick(gates.nth(known[0].i))
      await page.waitForTimeout(300)
      continue
    }
    const scout = stage.locator("button:visible").filter({ hasText: /망원경|살펴보기|정찰/ }).first()
    if (await scout.count()) {
      await tryClick(scout)
      await page.waitForTimeout(300)
      continue
    }
  }

  // ---- 그 밖의 진행 버튼 ----
  const btns = stage.locator("button:visible")
  if ((await btns.count()) === 0) break
  const labels = await btns.allInnerTexts()
  let pick = labels.findIndex((l) => /다음|확인|시작|공개|넘기|계속|입장|출발|열기|진입|도전|점령/.test(l) && !/다시|힌트/.test(l))
  if (pick < 0) pick = labels.findIndex((l) => !/다시|힌트/.test(l))
  if (pick < 0) pick = 0
  await tryClick(btns.nth(pick))
  await page.waitForTimeout(240)
}

const final = await txt()
console.log("거쳐 간 화면 " + stages.length + "개:")
stages.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`))
console.log("\n스크린샷:", SHOTS)

const ok = done && /성 점령|순위표/.test(final) && errors.length === 0
if (!ok) {
  console.error("\n✗ 실패")
  if (!done) console.error("  · 최종 화면에 도달하지 못했습니다.")
  if (errors.length) console.error("  · 콘솔 오류:", errors.slice(0, 5))
  console.error("  · 마지막 화면:", final.slice(0, 200))
  await browser.close()
  process.exit(1)
}

console.log("\n✓ 통과 — 성 점령까지 완주, 콘솔 오류 없음")
await browser.close()
