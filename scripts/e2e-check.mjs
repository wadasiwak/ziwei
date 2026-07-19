// 端到端測試：輸入生日 → 排盤 → 點宮位看解讀 → 存命盤 → 重整後載入。
// 需先 npm run build；本腳本自行啟動 vite preview (port 5200)。
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 5210
const BASE_URL = `http://localhost:${PORT}/`

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
})

const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  server.kill()
  process.exit(1)
}

try {
  // 等 server 起來
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(BASE_URL)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 300))
      if (i === 29) fail('preview server 沒起來')
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  await page.goto(BASE_URL)

  // 1. 填表排盤（陽曆 2000-8-16 寅時 女 → 命宮在午、木三局）
  await page.fill('.birth-form input', '測試')
  await page.selectOption('.birth-form select >> nth=0', '女')
  await page.selectOption('.birth-form select >> nth=1', 'solar')
  await page.selectOption('.birth-form select >> nth=2', '2000')
  await page.selectOption('.birth-form select >> nth=3', '8')
  await page.selectOption('.birth-form select >> nth=4', '16')
  await page.selectOption('.birth-form select >> nth=5', '2')
  await page.click('button.primary')

  await page.waitForSelector('.chart-grid', { timeout: 5000 })
  const centerText = await page.textContent('.chart-center')
  if (!centerText.includes('木三局')) fail(`中宮應顯示木三局，實得: ${centerText.slice(0, 80)}`)
  if (!centerText.includes('二〇〇〇年七月十七')) fail('中宮應顯示農曆日期')

  // 2. 點命宮 → 解讀面板出現、含主星文案
  await page.click('[data-palace="命宮"]')
  await page.waitForSelector('.reading-panel', { timeout: 3000 })
  const reading = await page.textContent('.reading-panel')
  if (!reading.includes('命宮')) fail('解讀面板應顯示命宮')
  if (reading.length < 200) fail('解讀面板內容過短，文案可能沒接上')

  // 3. 保存命盤
  await page.click('.chip-save')
  await page.waitForSelector('.saved-chip', { timeout: 3000 })

  // 4. 重整 → 命盤清單還在 → 點選載入
  await page.reload()
  await page.waitForSelector('.saved-chip', { timeout: 5000 })
  await page.click('.saved-chip .chip-load')
  await page.waitForSelector('.chart-grid', { timeout: 5000 })
  const centerAfter = await page.textContent('.chart-center')
  if (!centerAfter.includes('木三局')) fail('載入已存命盤後應重現同一張盤')

  // 5. 空宮借對宮提示（此盤若有空宮，點一顆驗證訊息）
  const emptyPalaces = await page.$$('.palace:has(.empty-palace)')
  if (emptyPalaces.length > 0) {
    await emptyPalaces[0].click()
    const borrow = await page.textContent('.reading-panel')
    if (!borrow.includes('借對宮')) fail('空宮應顯示借對宮提示')
  }

  // 6. 流年：總覽面板 + 年份切換
  const yearlyText = await page.textContent('.yearly-panel')
  if (!yearlyText.includes('流年命宮在本命')) fail('流年總覽應顯示流年命宮')
  if (!yearlyText.includes('化忌')) fail('流年總覽應顯示化忌落點')
  const yearBefore = await page.textContent('.year-bar .year-label')
  await page.click('.year-bar button:first-child') // 前一年
  const yearAfter = await page.textContent('.year-bar .year-label')
  if (yearBefore === yearAfter) fail('切換年份後年份列應更新')
  const soulTags = await page.$$('.chart-grid .yearly-tag.yearly-soul')
  if (soulTags.length !== 1) fail(`盤面應恰有一個流年命宮標記，實得 ${soulTags.length}`)

  // 7. 三方四正：點命宮後應有 3 個虛線框宮位
  await page.click('[data-palace="命宮"]')
  await page.waitForSelector('.reading-panel')
  const related = await page.$$('.palace.related')
  if (related.length !== 3) fail(`三方四正應標記 3 宮，實得 ${related.length}`)
  const readingText = await page.textContent('.reading-panel')
  if (!readingText.includes('三方四正會照')) fail('解讀面板應含三方四正區塊')

  // 8. 雙星同宮：此盤官祿宮為廉貞天府，應顯示組合解讀
  await page.click('[data-palace="官祿"]')
  await page.waitForSelector('.pair-entry', { timeout: 3000 })
  const pairText = await page.textContent('.pair-entry')
  if (!pairText.includes('同宮')) fail('雙星組合區塊應顯示')

  // 9. 格局卡片：此盤命宮三方有貪狼+鈴星（遷移），應偵測到鈴貪格
  const patternText = await page.textContent('.pattern-card')
  if (!patternText.includes('鈴貪格')) fail(`格局卡片應含鈴貪格，實得: ${patternText}`)

  // 10. 流月：點三月 → 盤面出現月命標記、面板出現流月區塊
  await page.click('.month-bar button:nth-of-type(3)')
  await page.waitForSelector('.chart-grid .yearly-tag.monthly-soul', { timeout: 3000 })
  const monthlyBlock = await page.textContent('.monthly-block')
  if (!monthlyBlock.includes('流月命宮在本命')) fail('流月區塊應顯示流月命宮')

  // 11. 分享連結：複製的網址帶生日參數，直接開啟能還原命盤
  await page.click('.header-actions button:first-child')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  if (!copied.includes('d=2000-8-16')) fail(`分享連結應含生日參數，實得: ${copied}`)
  const page2 = await context.newPage()
  await page2.goto(copied)
  await page2.waitForSelector('.chart-grid', { timeout: 5000 })
  const center2 = await page2.textContent('.chart-center')
  if (!center2.includes('木三局')) fail('分享連結開啟應還原同一張盤')
  await page2.close()

  // 12. AI 解讀 prompt：複製內容應含盤面資料與解讀指令，並跳出使用說明 toast
  await page.click('.header-actions button:nth-of-type(2)')
  const prompt = await page.evaluate(() => navigator.clipboard.readText())
  if (!prompt.includes('十二宮') || !prompt.includes('解讀要求')) fail('AI prompt 應含盤面資料與指令')
  if (!prompt.includes('流月四化')) fail('選了流月時 AI prompt 應含流月資料')
  const toast = await page.textContent('.copy-toast')
  if (!toast.includes('貼上')) fail('AI 解讀按下後應顯示使用說明 toast')

  // 13. 盤面圖例
  const legend = await page.textContent('.chart-legend')
  if (!legend.includes('生年四化') || !legend.includes('三方四正')) fail('盤面下方應有圖例')

  // 14. 隱私：analytics 回報路徑絕不可含生日參數（網址此時帶 ?d=...）
  const gcPath = await page.evaluate(() => window.goatcounter.path())
  if (gcPath.includes('d=') || gcPath.includes('?')) fail(`goatcounter path 不可含 query，實得: ${gcPath}`)

  // 15. 點左上角標題 = 重新排盤（開關表單）
  await page.click('.app-header h1')
  await page.waitForSelector('.birth-form', { timeout: 3000 })
  await page.click('.app-header h1')
  if (await page.$('.birth-form')) fail('再點一次標題應收起表單')

  // 16. 新手引導：時辰提示 + 範例命盤一鍵載入
  const page3 = await context.newPage()
  await page3.goto(BASE_URL)
  await page3.waitForSelector('.birth-form')
  await page3.click('.time-hint-toggle')
  const timeHint = await page3.textContent('.time-hint')
  if (!timeHint.includes('近似時辰')) fail('時辰提示應說明近似時辰做法')
  if (!timeHint.includes('命宮')) fail('時辰提示應說明時辰影響哪些宮位')
  await page3.click('.demo-btn')
  await page3.waitForSelector('.chart-grid', { timeout: 5000 })
  const demoBanner = await page3.textContent('.demo-banner')
  if (!demoBanner.includes('範例命盤')) fail('載入範例後應顯示範例標示')
  const demoCenter = await page3.textContent('.chart-center')
  if (!demoCenter.includes('範例命盤') || !demoCenter.includes('金四局')) fail('範例命盤應為 1992-7-7 申時女（金四局）')

  // 17. 小辭典：可展開、含核心術語
  await page3.click('.glossary > summary')
  const glossaryText = await page3.textContent('.glossary-list')
  for (const term of ['三方四正', '四化', '大限', '命宮', '身宮']) {
    if (!glossaryText.includes(term)) fail(`小辭典應含「${term}」`)
  }

  // 18. 分享連結帶檢視狀態：選宮位＋流月後複製，開啟連結應還原視圖
  await page3.click('[data-palace="夫妻"]')
  await page3.waitForSelector('.reading-panel')
  await page3.click('.month-bar button:nth-of-type(5)')
  await page3.waitForSelector('.chart-grid .yearly-tag.monthly-soul')
  await page3.click('.header-actions button:first-child')
  const stateUrl = await page3.evaluate(() => navigator.clipboard.readText())
  if (!stateUrl.includes('m=5') || !decodeURIComponent(stateUrl).includes('p=夫妻')) fail(`分享連結應帶宮位與流月參數，實得: ${stateUrl}`)
  const page4 = await context.newPage()
  await page4.goto(stateUrl)
  await page4.waitForSelector('.reading-panel', { timeout: 5000 })
  const restoredReading = await page4.textContent('.reading-panel h3')
  if (!restoredReading.includes('夫妻')) fail('開啟帶狀態連結應還原選中的宮位')
  const activeMonth = await page4.textContent('.month-bar button.active')
  if (!activeMonth.includes('五')) fail('開啟帶狀態連結應還原流月')
  await page4.close()

  // 19. 存成圖片：桌機應觸發 PNG 下載
  const [download] = await Promise.all([
    page3.waitForEvent('download', { timeout: 8000 }),
    page3.click('.header-actions button:nth-of-type(3)'),
  ])
  if (!download.suggestedFilename().endsWith('.png')) fail(`存成圖片應下載 PNG，實得: ${download.suggestedFilename()}`)

  // 20. 保存命盤管理：保存 → 改名＋備註 → 兩段式刪除
  const chipsBefore = (await page3.$$('.saved-chip')).length
  await page3.click('.chip-save')
  await page3.waitForFunction((n) => document.querySelectorAll('.saved-chip').length === n + 1, chipsBefore)
  await page3.click(`.saved-chip:nth-of-type(${chipsBefore + 1}) .chip-edit`)
  await page3.fill('.chip-editor label:nth-of-type(1) input', '示範改名')
  await page3.fill('.chip-editor label:nth-of-type(2) input', '測試備註')
  await page3.click('.chip-editor-actions .primary')
  const chipText = await page3.textContent(`.saved-chip:nth-of-type(${chipsBefore + 1})`)
  if (!chipText.includes('示範改名') || !chipText.includes('測試備註')) fail('改名與備註應顯示在命盤 chip 上')
  const delSelector = `.saved-chip:nth-of-type(${chipsBefore + 1}) .chip-del`
  await page3.click(delSelector)
  const delText = await page3.textContent(delSelector)
  if (!delText.includes('確定刪除')) fail('刪除應先要求確認')
  await page3.click(delSelector)
  await page3.waitForFunction((n) => document.querySelectorAll('.saved-chip').length === n, chipsBefore)
  await page3.close()

  await browser.close()
  console.log('e2e OK：排盤、解讀、存取、流年流月、三方四正、雙星、格局、分享、AI prompt、範例命盤、小辭典、帶狀態分享、存圖、保存管理 全部通過')
} finally {
  server.kill()
}
