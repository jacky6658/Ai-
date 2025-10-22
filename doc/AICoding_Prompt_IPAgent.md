# 🤖 AICoding 提示詞 — 建立短影音IP人設智能體

請建立一個 AI 智能體系統，目標為「短影音IP人設規劃與腳本生成」。

## 功能需求
1. 使用者透過聊天輸入個人故事與創作方向。
2. 智能體訪談並生成：
   - 《IP Profile》人設檔案
   - 《14天短影音規劃表》
   - 《今日3支腳本》
3. 系統需具備記憶（保存訪談紀錄），並能基於知識庫與範例模板生成內容。

## 技術規格
- **後端**：FastAPI + Gemini 2.5 Flash 模型 (串流逐字輸出)
- **前端**：HTML + JS 聊天框（使用 SSE）
- **知識庫**：Markdown / JSON，可在 RAG 模式中檢索
- **環境變數 (.env)**：
  ```
  GEMINI_API_KEY=你的金鑰
  GEMINI_MODEL=gemini-2.5-flash
  ```

## 模組設計
| 模組 | 功能 | 實作說明 |
|------|------|-----------|
| Persona Builder | 將訪談對話轉成人設資料 | 以 Prompt + Schema 驅動 |
| Content Planner | 生成14天內容規劃 | 依平台與人設自動匹配模板 |
| Script Generator | 生成短影音腳本 | 支援Hook/分鏡/CTA格式 |
| Memory Manager | 儲存歷史對話 | SQLite / Firestore |
| Exporter | 匯出為 PDF/JSON/Notion | 前端按鈕觸發 |

## 生成提示詞範例
> 你是「短影音人設總編輯」，請根據使用者的回答與知識庫，產出一份完整的 IP Profile、14天規劃表及今日3支腳本。每支腳本需含：Hook、分鏡、台詞、B-roll、CTA 與備選標題。遵守平台長度限制與禁語規範。

## 目標
完成後使用者只需透過聊天，即可一步生成「人設定位 → 拍攝方向 → 腳本產出」的完整流程。
