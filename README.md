# AI 短影音顧問智能系統

## 🚀 專案概述

這是一個完整的 AI 短影音顧問智能系統，包含前端和後端，提供三種核心 AI 功能：
- 🎯 AI 短影音定位顧問
- 💡 AI 選題小助手  
- 📝 AI 腳本生成大師

## 📊 專案狀態 (2024-10-20)

### ✅ 已完成功能

#### 後端功能
- **用戶認證系統**：Email 註冊/登入 + Google OAuth
- **推薦碼系統**：邀請朋友註冊，雙方各得 500 點數
- **點數管理**：新用戶 500 點，推薦獎勵 500 點，使用扣點
- **SSE 串流**：即時逐字輸出，提供 GPT 般體驗
- **RAG 整合**：結合知識庫進行智能回答
- **後台管理**：用戶管理、點數充值、推薦碼管理
- **資料庫修復**：自動修復缺失欄位，確保數據完整性

#### 前端功能
- **響應式設計**：完美支援桌面、平板、手機（iOS Safari 優化）
- **登入系統**：Email 註冊/登入 + Google OAuth（彈窗模式）
- **推薦碼系統**：邀請朋友功能，一鍵複製邀請連結
- **點數管理**：即時顯示點數餘額和使用統計
- **模態視窗**：知識庫、帳戶管理、設定、幫助中心
- **深色模式**：自動適配系統主題，手動切換

### 🔧 技術架構

#### 後端技術棧
- **FastAPI**：現代化的 Python Web 框架
- **SQLite**：輕量級資料庫
- **Uvicorn**：ASGI 服務器
- **Authlib**：OAuth 認證
- **Pydantic**：數據驗證

#### 前端技術棧
- **原生 HTML/CSS/JavaScript**：無框架依賴，快速載入
- **Tailwind CSS**：現代化樣式框架
- **EventSource**：SSE 串流技術
- **LocalStorage**：本地數據存儲
- **PWA 支援**：可安裝為桌面應用

## 📁 專案結構

```
ai_web_app/對話式/原始/
├── backend/                 # 後端目錄
│   ├── app.py              # 主應用程式
│   ├── chat_stream.py      # SSE 串流聊天
│   ├── memory.py           # 用戶記憶管理
│   ├── rag.py              # 檢索增強生成
│   ├── knowledge_loader.py # 知識庫載入
│   ├── providers.py        # LLM 提供商介面
│   ├── admin/
│   │   └── admin.html      # 後台管理介面
│   ├── data/               # 知識庫文件
│   │   ├── kb_positioning.txt
│   │   ├── kb_topic_selection.txt
│   │   └── kb_script_generation.txt
│   ├── requirements.txt    # Python 依賴
│   ├── Dockerfile          # Docker 配置
│   └── README.md           # 後端文檔
├── front/                  # 前端目錄
│   ├── index.html          # 主頁面
│   ├── DEPLOYMENT.md       # 部署指南
│   └── README.md           # 前端文檔
└── README.md               # 專案總覽（本文件）
```

## 🚀 快速開始

### 後端啟動
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### 前端啟動
```bash
cd front
# 使用任何 HTTP 服務器
python -m http.server 8000
# 或 npx serve .
```

### 訪問地址
- **前端**：http://localhost:8000
- **後端**：http://localhost:8080
- **API 文檔**：http://localhost:8080/docs
- **後台管理**：http://localhost:8080/admin

## 🔧 環境配置

### 後端環境變數
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URI=https://your-domain.com/auth/google/callback
ADMIN_TOKEN=your_admin_token
DB_PATH=three_agents_system.db
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:8000
```

### 前端配置
```javascript
// 在 index.html 中修改
const API_BASE = 'http://localhost:8080';  // 開發環境
// const API_BASE = 'https://your-backend-domain.com';  // 生產環境
```

## 📚 功能說明

### 用戶系統
1. **註冊/登入**：支持 Email 和 Google 兩種方式
2. **推薦碼**：邀請朋友註冊，雙方各得 500 點數
3. **點數管理**：新用戶 500 點，推薦獎勵 500 點，使用扣點
4. **用戶檔案**：個人資料管理和使用統計

### AI 功能
1. **定位顧問**：基於知識庫的短影音定位分析
2. **選題助手**：智能選題建議和內容規劃
3. **腳本生成**：支持多種模板（A-E）和平台（Reels/TikTok/小紅書/YouTube Shorts）
4. **SSE 串流**：即時逐字輸出，提供 GPT 般體驗
5. **RAG 整合**：結合知識庫進行智能回答

### 管理功能
1. **後台管理**：用戶管理、點數充值、推薦碼管理
2. **知識庫**：查看歷史生成內容和聊天記錄
3. **帳戶管理**：個人資料和點數管理
4. **設定中心**：個性化配置
5. **幫助中心**：使用指南和常見問題

## 🚀 部署指南

### 後端部署
1. **Docker 部署**：
```bash
cd backend
docker build -t ai-video-backend .
docker run -p 8080:8080 -e GOOGLE_CLIENT_ID=xxx -e GOOGLE_CLIENT_SECRET=xxx ai-video-backend
```

2. **雲端部署**：
   - 推薦使用 Zeabur
   - 支援 Railway、Heroku、AWS/GCP/Azure

### 前端部署
1. **GitHub Pages**：
   - 推送到 GitHub
   - 啟用 GitHub Pages
   - 訪問 `https://username.github.io/repository-name`

2. **其他平台**：
   - Netlify：拖拽部署
   - Vercel：Git 集成部署
   - Zeabur：一鍵部署

## 🔍 故障排除

### 常見問題
1. **登入問題**：檢查 Google OAuth 配置
2. **API 連接**：確認 CORS 設定和 API_BASE 配置
3. **資料庫問題**：檢查資料庫文件權限和路徑
4. **樣式問題**：清除瀏覽器快取

### 調試技巧
```javascript
// 前端調試
localStorage.setItem('debug', 'true');
console.log('User:', JSON.parse(localStorage.getItem('user')));

// 後端調試
curl http://localhost:8080/healthz
```

## 📞 支援

- **技術支援**：support@example.com
- **文檔**：https://docs.example.com
- **GitHub Issues**：https://github.com/your-repo/issues

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件

---

## 🎯 快速連結

- [後端文檔](backend/README.md)
- [前端文檔](front/README.md)
- [部署指南](front/DEPLOYMENT.md)
- [API 文檔](http://localhost:8080/docs)

## 📈 更新日誌

### v1.0.0 (2024-10-20)
- ✅ 完成用戶認證系統
- ✅ 實現推薦碼系統
- ✅ 添加點數管理功能
- ✅ 優化 iOS Safari 登入體驗
- ✅ 修復模態視窗關閉問題
- ✅ 完善後台管理系統
- ✅ 添加完整的文檔