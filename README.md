# 紫微斗數排盤

輸入出生年月日時（國曆或農曆皆可），立即產生紫微斗數十二宮命盤，附 14 主星 × 12 宮共 168 則白話解讀。

- 排盤引擎：[iztro](https://github.com/SylarLong/iztro)（安星、四化、大限、農曆轉換）
- 所有計算都在瀏覽器完成，生日資料不會上傳到任何伺服器
- 流量統計用 [GoatCounter](https://www.goatcounter.com/)（無 cookie 的匿名頁面計數）；回報路徑會剝除 query 參數，分享連結裡的生日資料不會進到統計
- 命盤清單存在瀏覽器 localStorage，可保存多人命盤隨時切換；生日參數編在網址裡，複製連結即可分享命盤
- 時辰含早子時（00:00–00:59）／晚子時（23:00–23:59）之分，農曆輸入支援閏月
- 流年流月：年份/農曆月選擇，盤面疊流年宮名與四化（外框色標與本命實心區分），總覽面板含大限四化與 48 則流年四化文案
- 點宮位看解讀：三方四正虛線標記與會照星曜、14 主星 × 12 宮 168 則文案、24 組雙星同宮組合解讀、空宮借對宮
- 格局判斷：紫府同宮、殺破狼、機月同梁、火貪／鈴貪、日月同宮、陽梁昌祿、祿馬交馳、石中隱玉
- AI 解讀：一鍵複製整盤結構化資料＋解讀指令，貼到任何 LLM 取得綜合解讀

## 開發

```
npm install
npm run dev        # http://localhost:5200
npm run check      # 文案完整性 + 古法排盤驗算（命身宮、五行局、四化）
npm run build
npm run e2e        # Playwright 端到端（需先 build）
```

## 部署

Push 到 main 之後由 GitHub Actions 自動 build 並部署到 GitHub Pages。

## 版權聲明 / Copyright

© 2026 wadasiwak. All rights reserved.

程式碼與解讀文字（含 14 主星 × 12 宮共 168 則主星宮位解讀，為原創內容）版權所有，保留一切權利，未經授權禁止轉載。

排盤引擎使用開源庫 [iztro](https://github.com/SylarLong/iztro)（MIT License），其授權條款見該專案。
