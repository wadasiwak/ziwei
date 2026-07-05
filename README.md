# 紫微斗數排盤

輸入出生年月日時（國曆或農曆皆可），立即產生紫微斗數十二宮命盤，附 14 主星 × 12 宮共 168 則白話解讀。

- 排盤引擎：[iztro](https://github.com/SylarLong/iztro)（安星、四化、大限、農曆轉換）
- 所有計算都在瀏覽器完成，生日資料不會上傳到任何伺服器
- 命盤清單存在瀏覽器 localStorage，可保存多人命盤隨時切換
- 時辰含早子時（00:00–00:59）／晚子時（23:00–23:59）之分，農曆輸入支援閏月

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
