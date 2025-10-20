# AI 短影音智能體 - 前端服務

## 專案簡介
AI 短影音智能體前端服務，提供直觀的聊天介面和腳本結果展示功能。

## 技術棧
- **前端**: HTML5 + CSS3 + JavaScript (Vanilla)
- **伺服器**: Nginx
- **部署**: Zeabur
- **響應式設計**: 支援手機和電腦版

## 功能特色
- 即時聊天介面
- 短影音設定面板
- 腳本結果自動解析
- 響應式設計
- Markdown 格式自動清理
- 手機版優化

## 本地開發

### 使用 Python HTTP 伺服器
```bash
cd frontend
python -m http.server 8080
```

### 使用 Nginx
```bash
docker build -t ai-video-frontend .
docker run -p 8080:8080 ai-video-frontend
```

## 環境配置

### 開發環境
- 前端: `http://localhost:8080`
- 後端 API: `http://127.0.0.1:8000/api/chat/stream`

### 部署環境
- 前端: `https://aivideonew.zeabur.app`
- 後端 API: `https://aivideobackend.zeabur.app/api/chat/stream`

## 功能說明

### 設定面板
- **平台選擇**: IG Reels、TikTok、小紅書
- **主題設定**: 自定義短影音主題
- **腳本時長**: 30/60/90秒選擇
- **帳號定位**: 設定帳號風格定位

### 聊天功能
- 即時串流回應
- 對話歷史記錄
- 智能結果解析
- 自動格式化清理

### 結果展示
- **主題**: 自動提取主題標題
- **腳本內容**: 台詞、秒數、CTA
- **畫面感**: 鏡頭、音效建議
- **發佈文案**: 社群媒體文案

## 技術特點

### Markdown 清理
- 自動移除 `**` 符號
- 將 `**文字**` 轉換為粗體顯示
- 支援標題格式清理

### 響應式設計
- 手機版優化
- 觸控友好介面
- 自適應佈局

### 錯誤處理
- 網路連線錯誤提示
- 詳細調試信息
- 友善錯誤訊息

## Docker 部署

### 建構映像
```bash
docker build -t ai-video-frontend .
```

### 運行容器
```bash
docker run -p 8080:8080 ai-video-frontend
```

## 部署到 Zeabur

1. 將專案推送到 GitHub
2. 在 Zeabur 建立新專案
3. 連接 GitHub 倉庫
4. 使用 Dockerfile 部署
5. 設定環境變數（如需要）

## 專案結構
```
frontend/
├── index.html         # 前端主頁面
├── Dockerfile         # 容器化配置
├── nginx.conf         # Nginx 配置
└── README.md         # 說明文件
```

## 瀏覽器支援
- Chrome (推薦)
- Firefox
- Safari
- Edge
- 手機瀏覽器

## 注意事項
- 確保後端服務正常運行
- 檢查 CORS 設定
- 手機版建議使用外部瀏覽器開啟

## 版權
2025 AIJob學院版權所有
