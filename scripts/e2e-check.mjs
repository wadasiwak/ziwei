// 端到端測試：輸入生日 → 排盤 → 點宮位看解讀 → 存命盤 → 重整後載入。
// 需先 npm run build；本腳本自行啟動 vite preview (port 5200)。
import { spawn } from 'node:child_process'
import { getTotalDaysOfLunarMonth, lunar2solar, solar2lunar } from 'lunar-lite'
import { chromium } from 'playwright'

const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月']
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

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

  // 19. 大限：範例命盤（壬申陽女逆行、金四局 4 歲起運）
  const decBtns = await page3.$$('.decadal-bar button')
  if (decBtns.length !== 12) fail(`大限列應有 12 個區間，實得 ${decBtns.length}`)
  const firstDec = await page3.textContent('.decadal-bar button:first-of-type')
  if (!firstDec.includes('4–13') || !firstDec.includes('辛亥')) fail(`第一個大限應為 4–13 辛亥，實得: ${firstDec}`)
  // 點 34–43 大限（戊申，2025–2034，含目前流年）→ 盤面疊加大限層、面板出現概述
  await page3.click('.decadal-bar button:nth-of-type(4)')
  await page3.waitForSelector('.decadal-panel', { timeout: 3000 })
  const decPanel = await page3.textContent('.decadal-panel')
  if (!decPanel.includes('大限命宮在本命') || !decPanel.includes('子女')) fail(`大限面板應顯示大限命宮落本命子女宮，實得: ${decPanel.slice(0, 80)}`)
  const decSouls = await page3.$$('.chart-grid .yearly-tag.decadal-soul')
  if (decSouls.length !== 1) fail(`盤面應恰有一個大限命宮標記，實得 ${decSouls.length}`)
  const decTags = await page3.$$('.chart-grid .yearly-tag.decadal-tag')
  if (decTags.length !== 12) fail(`盤面應有 12 個大限宮名標記，實得 ${decTags.length}`)
  if ((await page3.$$('.chart-grid .mutagen.dec')).length === 0) fail('盤面應標記大限四化')
  const decRange = await page3.textContent('.year-bar .dec-range')
  if (!decRange.includes('2025–2034')) fail(`流年列應標示大限年份區間，實得: ${decRange}`)
  // 與流年連動：改點 4–13 大限，所選流年不在區間內 → 自動跳到 1995
  await page3.click('.decadal-bar button:first-of-type')
  const jumpedYear = await page3.textContent('.year-bar .year-label')
  if (!jumpedYear.includes('1995')) fail(`點大限後流年應跳到區間起始年 1995，實得: ${jumpedYear}`)
  const nowDec = await page3.textContent('.decadal-bar button.now')
  if (!nowDec.includes('4–13')) fail(`所選流年所屬大限應有標示，實得: ${nowDec}`)
  // 分享連結帶大限（dl=宮位索引），開啟後還原大限視圖
  await page3.click('.header-actions button:first-child')
  const decUrl = await page3.evaluate(() => navigator.clipboard.readText())
  if (!decUrl.includes('dl=')) fail(`分享連結應帶大限參數，實得: ${decUrl}`)
  const page5 = await context.newPage()
  await page5.goto(decUrl)
  await page5.waitForSelector('.decadal-panel', { timeout: 5000 })
  const restoredDec = await page5.textContent('.decadal-bar button.active')
  if (!restoredDec.includes('4–13')) fail(`開啟連結應還原選中的大限，實得: ${restoredDec}`)
  await page5.close()
  // 再點一次取消大限層
  await page3.click('.decadal-bar button.active')
  if (await page3.$('.decadal-panel')) fail('再點一次大限應取消疊加')

  // 19b. 流日：此時 page3 為流年 1995、流月五月 → 流日列天數應與農曆該月一致
  const expectedDays = getTotalDaysOfLunarMonth(lunar2solar('1995-5-1', false).toString())
  const dayBtns = await page3.$$('.day-bar button')
  if (dayBtns.length !== expectedDays) fail(`流日列應有 ${expectedDays} 天（農曆 1995 年五月），實得 ${dayBtns.length}`)
  await page3.click('.day-bar button:nth-of-type(3)') // 初三
  await page3.waitForSelector('.chart-grid .yearly-tag.daily-soul', { timeout: 3000 })
  const dailySouls = await page3.$$('.chart-grid .yearly-tag.daily-soul')
  if (dailySouls.length !== 1) fail(`盤面應恰有一個流日命宮標記，實得 ${dailySouls.length}`)
  if ((await page3.$$('.chart-grid .mutagen.day')).length === 0) fail('盤面應標記流日四化')
  const dailyBlock = await page3.textContent('.daily-block')
  if (!dailyBlock.includes('今日盤') || !dailyBlock.includes('流日命宮在本命')) fail(`解讀面板應有今日盤簡述，實得: ${dailyBlock.slice(0, 60)}`)
  const dayInfo = await page3.textContent('.day-bar .day-info')
  const expectedSolar = lunar2solar('1995-5-3', false).toString()
  if (!dayInfo.includes(`日・國曆 ${expectedSolar}`)) fail(`流日列應顯示日柱與對應國曆（五月初三＝${expectedSolar}），實得: ${dayInfo}`)
  // 分享連結帶流日（dd），開啟後還原
  await page3.click('.header-actions button:first-child')
  const dayUrl = await page3.evaluate(() => navigator.clipboard.readText())
  if (!dayUrl.includes('dd=3')) fail(`分享連結應帶流日參數，實得: ${dayUrl}`)
  const page6 = await context.newPage()
  await page6.goto(dayUrl)
  await page6.waitForSelector('.daily-block', { timeout: 5000 })
  const restoredDay = await page6.textContent('.day-bar button.active')
  if (!restoredDay.includes('初三')) fail(`開啟連結應還原選中的流日，實得: ${restoredDay}`)
  await page6.close()
  // 再點一次取消流日層
  await page3.click('.day-bar button.active')
  if (await page3.$('.daily-block')) fail('再點一次流日應取消疊加')

  // 19c. 「今天」快捷鍵：一鍵跳到今日流年／流月／流日
  const now = new Date()
  const tl = solar2lunar(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`)
  await page3.click('.year-bar .today-btn')
  await page3.waitForSelector('.daily-block', { timeout: 3000 })
  const todayYearLabel = await page3.textContent('.year-bar .year-label')
  if (!todayYearLabel.includes(String(tl.lunarYear))) fail(`今天快捷鍵應跳到流年 ${tl.lunarYear}，實得: ${todayYearLabel}`)
  const todayMonth = await page3.textContent('.month-bar button.active')
  if (!todayMonth.includes(LUNAR_MONTH_NAMES[tl.lunarMonth - 1].replace('月', ''))) {
    fail(`今天快捷鍵應選中${LUNAR_MONTH_NAMES[tl.lunarMonth - 1]}，實得: ${todayMonth}`)
  }
  const todayDay = await page3.textContent('.day-bar button.active')
  if (!todayDay.includes(LUNAR_DAY_NAMES[tl.lunarDay - 1])) fail(`今天快捷鍵應選中${LUNAR_DAY_NAMES[tl.lunarDay - 1]}，實得: ${todayDay}`)
  if (!tl.isLeap) {
    const nowMark = await page3.textContent('.day-bar button.now')
    if (!nowMark.includes(LUNAR_DAY_NAMES[tl.lunarDay - 1])) fail('流日列應在今天的日子有底線標示')
  }
  const todaySolar = await page3.textContent('.day-bar .day-info')
  if (!tl.isLeap && !todaySolar.includes(`國曆 ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`)) {
    fail(`今天快捷鍵後流日列應顯示今天的國曆日期，實得: ${todaySolar}`)
  }

  // 20. 存成圖片：桌機應觸發 PNG 下載
  const [download] = await Promise.all([
    page3.waitForEvent('download', { timeout: 8000 }),
    page3.click('.header-actions button:nth-of-type(3)'),
  ])
  if (!download.suggestedFilename().endsWith('.png')) fail(`存成圖片應下載 PNG，實得: ${download.suggestedFilename()}`)

  // 21. 保存命盤管理：保存 → 改名＋備註 → 兩段式刪除
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

  // 22. 解讀文庫：不用排盤即可瀏覽、搜尋、導流回排盤表單
  const page7 = await context.newPage()
  await page7.goto(BASE_URL)
  await page7.waitForSelector('.lib-btn', { timeout: 5000 })
  await page7.click('.lib-btn')
  await page7.waitForSelector('.library', { timeout: 3000 })
  if (await page7.$('.birth-form')) fail('文庫開啟時應隱藏排盤表單')
  const chips = await page7.$$('.star-chips button')
  if (chips.length !== 14) fail(`文庫應有 14 顆主星 chip，實得 ${chips.length}`)
  let cards = await page7.$$('.lib-card')
  if (cards.length !== 12) fail(`預設主星（紫微）應列 12 宮解讀，實得 ${cards.length}`)
  const firstCard = await page7.textContent('.lib-card:first-of-type')
  if (!firstCard.includes('紫微・命宮') || !firstCard.includes('帝座')) fail(`第一張卡應為紫微・命宮，實得: ${firstCard.slice(0, 40)}`)
  // 換一顆星
  await page7.click('.star-chips button:nth-of-type(2)')
  const jiCard = await page7.textContent('.lib-card:first-of-type')
  if (!jiCard.includes('天機・命宮')) fail(`點天機後應顯示天機的 12 宮，實得: ${jiCard.slice(0, 40)}`)
  // 雙星同宮與格局分區
  await page7.click('.lib-tabs button:nth-of-type(2)')
  cards = await page7.$$('.lib-card')
  if (cards.length !== 24) fail(`雙星同宮分區應有 24 則，實得 ${cards.length}`)
  await page7.click('.lib-tabs button:nth-of-type(3)')
  cards = await page7.$$('.lib-card')
  if (cards.length !== 9) fail(`格局分區應有 9 則，實得 ${cards.length}`)
  const patternCard = await page7.textContent('.lib-card:first-of-type')
  if (!patternCard.includes('紫府同宮')) fail(`格局分區應含紫府同宮，實得: ${patternCard.slice(0, 40)}`)
  // 搜尋：宮名
  await page7.fill('.library-search', '夫妻')
  await page7.waitForSelector('.lib-results', { timeout: 3000 })
  let count = await page7.textContent('.lib-count')
  if (!count.includes('主星×宮位 14')) fail(`搜尋「夫妻」應命中 14 則主星×宮位，實得: ${count}`)
  // 搜尋：內文關鍵字（跨分區）
  await page7.fill('.library-search', '帝座')
  count = await page7.textContent('.lib-count')
  const hitCard = await page7.textContent('.lib-results .lib-card:first-of-type')
  if (!hitCard.includes('紫微')) fail(`搜尋「帝座」應命中紫微的解讀，實得: ${hitCard.slice(0, 40)}`)
  // 導流：從任一則回到排盤表單
  await page7.click('.lib-results .lib-card:first-of-type .lib-use')
  await page7.waitForSelector('.birth-form', { timeout: 3000 })
  if (await page7.$('.library')) fail('點「排我的盤」後文庫應關閉、回到排盤表單')
  await page7.close()

  // 23. 合盤比較：存兩張盤 → 選甲乙 → 摘要卡／互看區／五行局／四化渲染 → 分享連結還原 → 離開
  const page8 = await context.newPage()
  await page8.goto(BASE_URL)
  await page8.waitForSelector('.saved-chip', { timeout: 5000 }) // 先前測試已存「測試」
  await page8.waitForSelector('.birth-form')
  await page8.click('.demo-btn') // 第二張：範例命盤（金四局）
  await page8.waitForSelector('.chart-grid', { timeout: 5000 })
  await page8.click('.chip-save')
  await page8.waitForFunction(() => document.querySelectorAll('.saved-chip').length >= 2)
  await page8.click('.chip-syn')
  await page8.waitForSelector('.syn-picker', { timeout: 3000 })
  await page8.click('.syn-picker .primary') // 預設甲＝第一張、乙＝第二張
  await page8.waitForSelector('.synastry', { timeout: 5000 })
  const synText = await page8.textContent('.synastry')
  if (!synText.includes('測試') || !synText.includes('範例命盤')) fail('合盤應顯示兩人名稱')
  if ((await page8.$$('.syn-card')).length !== 2) fail('合盤應有兩張並列摘要卡')
  if (!synText.includes('木三局') || !synText.includes('金四局')) fail('摘要卡應顯示兩人五行局')
  const gazes = await page8.$$('.syn-gaze')
  if (gazes.length !== 2) fail(`互看區應雙向各一，實得 ${gazes.length}`)
  const gazeText = await page8.textContent('.syn-gaze')
  if (!gazeText.includes('夫妻宮') || !gazeText.includes('命宮')) fail('互看區應含夫妻宮×命宮對照')
  if (!gazeText.includes('在關係中')) fail('互看區應引用主星「在關係中的樣子」文案')
  if ((await page8.$$('.syn-bridge')).length !== 2) fail('互看區雙向應各有一句組合橋接語')
  const elText = await page8.textContent('.syn-element')
  if (!elText.includes('金剋木')) fail(`五行局區塊應顯示木三局×金四局＝金剋木，實得: ${elText.slice(0, 60)}`)
  const mutText = await page8.textContent('.syn-mutagen')
  if (!mutText.includes('化祿') || !mutText.includes('化忌')) fail('生年四化區塊應顯示祿忌落點')
  if (!synText.includes('娛樂')) fail('合盤頁應顯示免責聲明')
  // 分享連結：兩組生日參數，開啟直接還原合盤
  await page8.click('.syn-share')
  const synShareUrl = await page8.evaluate(() => navigator.clipboard.readText())
  if (!synShareUrl.includes('syn=1') || !synShareUrl.includes('d2=')) fail(`合盤分享連結應含兩組生日參數，實得: ${synShareUrl}`)
  const page9 = await context.newPage()
  await page9.goto(synShareUrl)
  await page9.waitForSelector('.synastry', { timeout: 5000 })
  const synText9 = await page9.textContent('.synastry')
  if (!synText9.includes('木三局') || !synText9.includes('金四局')) fail('開啟合盤連結應直接還原同一組合盤')
  if ((await page9.$$('.syn-gaze')).length !== 2) fail('合盤連結還原後互看區應完整渲染')
  await page9.close()
  // 離開合盤 → 回到一般視圖
  await page8.click('.syn-close')
  if (await page8.$('.synastry')) fail('離開合盤後應回到一般視圖')
  await page8.waitForSelector('.saved-chip', { timeout: 3000 })
  await page8.close()

  await browser.close()
  console.log('e2e OK：排盤、解讀、存取、流年流月流日、今天快捷、大限、三方四正、雙星、格局、分享、AI prompt、範例命盤、小辭典、帶狀態分享、存圖、保存管理、解讀文庫、合盤比較 全部通過')
} finally {
  server.kill()
}
