// 端到端測試：輸入生日 → 排盤 → 點宮位看解讀 → 存命盤 → 重整後載入。
// 需先 npm run build；本腳本自行啟動 vite preview (port 5200)。
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 5200
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
  const page = await browser.newPage()
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
  const soulTags = await page.$$('.yearly-tag.yearly-soul')
  if (soulTags.length !== 1) fail(`盤面應恰有一個流年命宮標記，實得 ${soulTags.length}`)

  await browser.close()
  console.log('e2e OK：排盤、解讀、存取命盤、空宮借對宮全部通過')
} finally {
  server.kill()
}
