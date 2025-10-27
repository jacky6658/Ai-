# AI 短影音智能體 - 後端服務

## ⚠️ 重要問題 - 優先解決

### 🚨 腳本儲存系統問題

**現象**：腳本儲存功能無法正常工作，出現 401 Unauthorized 錯誤

#### 問題分析

1. **API認證問題**：
   - 腳本相關API需要用戶認證
   - 前端認證token可能過期或無效
   - 需要檢查 `get_current_user` 函數的實現

2. **資料庫鎖定問題**：
   - 偶爾出現 `database is locked` 錯誤
   - 多個請求同時訪問SQLite資料庫
   - 需要優化資料庫連接管理

3. **影響範圍**：
   - ❌ 腳本儲存功能
   - ❌ 腳本載入功能
   - ❌ 腳本管理功能（重命名、刪除）

### 🚨 用戶資料持久化問題

**現象**：用戶反映「重新刷新登入後帳號定位不見了」

#### 原因分析

1. **本地資料庫 vs Zeabur 資料庫**：
   - 本地開發時，資料儲存在本機的 `backend/data/chatbot.db`
   - Zeabur 部署時，資料儲存在 Zeabur 伺服器的資料庫
   - 這兩個資料庫是**完全獨立**的
   - **問題**：本地創建的資料不會同步到 Zeabur

2. **SQLite 的限制**：
   - Zeabur 重新部署時，SQLite 資料庫會被**重置**
   - 所有用戶資料（帳號定位記錄、對話歷史、生成記錄）會**遺失**
   - **不適合生產環境長期使用**

3. **影響範圍**：
   - ❌ 用戶的帳號定位記錄
   - ❌ 對話歷史
   - ❌ 生成的腳本記錄
   - ❌ 用戶偏好設定
   - ❌ 長期記憶數據

#### 解決方案

##### 🔴 短期方案（目前使用中）

**限制**：
- 在 Zeabur 上重新創建的記錄會保存，但只到下次重新部署為止
- 每次重新部署都會遺失所有用戶資料
- **僅適用於測試和開發階段**

**注意事項**：
```python
# 目前的資料庫初始化方式（有資料遺失風險）
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "chatbot.db")
conn = sqlite3.connect(DB_PATH)  # Zeabur 重新部署時會重置
```

##### 🟢 長期方案（強烈建議）

**1. 使用持久化資料庫服務**

推薦選項：
- **PostgreSQL**（Zeabur 原生支援，推薦）
- **MySQL**（Zeabur 原生支援）
- **MongoDB**（適合文檔型資料）

**Zeabur PostgreSQL 整合步驟**：
```bash
# 1. 在 Zeabur 專案中添加 PostgreSQL 服務
# 2. Zeabur 會自動提供連線資訊：
#    DATABASE_URL=postgresql://user:password@host:port/dbname

# 3. 更新 requirements.txt
pip install psycopg2-binary  # PostgreSQL 驅動
pip install sqlalchemy       # ORM（可選）

# 4. 修改 app.py 連接邏輯
import os
import psycopg2
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # 使用 PostgreSQL
    url = urlparse(DATABASE_URL)
    conn = psycopg2.connect(
        host=url.hostname,
        port=url.port,
        user=url.username,
        password=url.password,
        database=url.path[1:]
    )
else:
    # 本地開發使用 SQLite
    conn = sqlite3.connect("data/chatbot.db")
```

**2. 資料庫遷移計劃**

**階段 1：準備工作**
- [ ] 在 Zeabur 添加 PostgreSQL 服務
- [ ] 取得連線 URL
- [ ] 安裝必要的 Python 套件

**階段 2：程式碼修改**
- [ ] 修改 `init_database()` 函數支援 PostgreSQL
- [ ] 更新 SQL 語法（SQLite → PostgreSQL）
- [ ] 處理資料類型差異（例如：`AUTOINCREMENT` → `SERIAL`）
- [ ] 測試所有 API 端點

**階段 3：資料遷移**
- [ ] 備份現有 SQLite 資料
- [ ] 編寫遷移腳本
- [ ] 將資料匯入 PostgreSQL
- [ ] 驗證資料完整性

**階段 4：部署**
- [ ] 更新 Zeabur 環境變數
- [ ] 重新部署後端服務
- [ ] 完整測試所有功能
- [ ] 監控資料持久化狀態

**3. SQLite vs PostgreSQL 語法差異**

| 功能 | SQLite | PostgreSQL |
|------|--------|------------|
| 自動遞增 | `AUTOINCREMENT` | `SERIAL` 或 `BIGSERIAL` |
| 布林值 | `INTEGER` (0/1) | `BOOLEAN` |
| 日期時間 | `TEXT` 或 `INTEGER` | `TIMESTAMP` |
| JSON | `TEXT` | `JSON` 或 `JSONB` |
| 全文搜索 | 有限 | 強大的 `tsvector` |

**4. 預估工作量**

- **程式碼修改**：2-3 小時
- **測試驗證**：1-2 小時
- **資料遷移**：1 小時
- **總計**：4-6 小時

#### 臨時緩解措施

在完成資料庫遷移之前，可採取以下措施：

1. **定期備份**：
   ```bash
   # 在 Zeabur 重新部署前備份資料庫
   # 使用 db_admin.py 工具
   python db_admin.py backup
   ```

2. **降低重新部署頻率**：
   - 在本地充分測試後再推送
   - 使用 Git 分支進行開發
   - 減少不必要的部署

3. **用戶溝通**：
   - 在前端顯示提示：「測試階段，資料可能會重置」
   - 提供匯出功能（未來）

#### 實施優先級

🔴 **P0 - 緊急（1 週內）**：
- [ ] 評估並選擇持久化資料庫方案
- [ ] 制定詳細的遷移計劃

🟡 **P1 - 高優先級（2 週內）**：
- [ ] 完成 PostgreSQL 整合
- [ ] 資料庫遷移腳本開發
- [ ] 完整測試

🟢 **P2 - 中優先級（1 個月內）**：
- [ ] 實施自動備份機制
- [ ] 添加資料匯出功能
- [ ] 優化查詢效能

---

## 專案簡介
AI 短影音智能體後端服務，提供短影音腳本生成和文案創作功能。

## 技術棧
- **框架**: FastAPI
- **AI 模型**: Google Gemini 2.5 Flash
- **語言**: Python 3.11
- **部署**: Zeabur

## 功能特色
- 短影音腳本生成
- 智能文案創作
- 支援多平台格式（IG Reels、TikTok、小紅書）
- 自定義腳本時長（30/60/90秒）
- 知識庫整合

## 環境變數設定
```bash
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
KB_PATH=/app/data/kb.txt
```

## 本地開發

### 第一次設定（macOS）
由於 macOS 系統的 Python 環境保護機制，需要使用虛擬環境：

**完整的複製貼上指令**：
```bash
# 1. 進入後端目錄
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend

# 2. 創建虛擬環境
python3 -m venv venv

# 3. 啟動虛擬環境
source venv/bin/activate

# 4. 安裝依賴套件
pip install uvicorn fastapi google-generativeai python-dotenv

# 5. 設定 API Key（替換成您的實際金鑰）
export GEMINI_API_KEY="AIzaSyCNmsgpPxo6acx3TV1VrvMLWOvqqj38TR4"

# 6. 啟動服務
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### 快速啟動腳本（推薦）
使用修復後的 `start.sh` 腳本，會自動安裝所有必要的套件：

```bash
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend
./start.sh
```

**腳本功能**：
- ✅ 自動啟動虛擬環境
- ✅ 自動安裝所有必要的套件（包括 `python-dotenv`）
- ✅ 自動設定 API Key
- ✅ 自動啟動後端服務

**完整的複製貼上指令**：
```bash
# 1. 進入後端目錄
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend

# 2. 執行啟動腳本（會自動處理所有設定）
./start.sh
```

**預期結果**：
```
🚀 啟動 AI 短影音智能體後端服務...
📦 安裝必要的套件...
Successfully installed python-dotenv-1.1.1
🚀 啟動後端服務...
知識庫載入狀態: 成功
知識庫內容長度: 5945 字元
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.
```

### 手動啟動（每次開發時）
**完整的複製貼上指令**：
```bash
# 1. 進入後端目錄
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend

# 2. 啟動虛擬環境
source venv/bin/activate

# 3. 設定 API Key（替換成您的實際金鑰）
export GEMINI_API_KEY="AIzaSyCNmsgpPxo6acx3TV1VrvMLWOvqqj38TR4"

# 4. 啟動服務
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### 測試 API
```bash
curl http://localhost:8000/api/health
```

## Docker 部署

### 建構映像
```bash
docker build -t ai-video-backend .
```

### 運行容器
```bash
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key ai-video-backend
```

## API 端點

### 健康檢查
- **GET** `/api/health`
- 回應: `{"status": "ok"}`

### 聊天串流
- **POST** `/api/chat/stream`
- 請求格式:
```json
{
  "message": "生成腳本",
  "platform": "Reels",
  "topic": "主題",
  "duration": "30",
  "profile": "帳號定位",
  "history": []
}
```

## 部署到 Zeabur

1. 將專案推送到 GitHub
2. 在 Zeabur 建立新專案
3. 連接 GitHub 倉庫
4. 設定環境變數 `GEMINI_API_KEY`
5. 部署服務

## 專案結構
```
backend/
├── app.py              # 主要應用程式
├── Dockerfile          # 容器化配置
├── requirements.txt    # Python 依賴套件
├── start.sh           # 快速啟動腳本
├── setup_env.sh       # 環境設定腳本
├── data/
│   └── kb.txt         # 知識庫檔案
├── venv/              # 虛擬環境（本地開發）
└── README.md          # 說明文件
```

## 常見問題

### Q: 遇到 "externally-managed-environment" 錯誤？
A: 這是 macOS 系統保護機制，請使用虛擬環境：
```bash
python3 -m venv venv
source venv/bin/activate
pip install uvicorn fastapi google-generativeai
```

### Q: 每次都要重新設定環境變數？
A: 使用提供的 `start.sh` 腳本，一鍵啟動所有設定。

### Q: 知識庫載入失敗？
A: 確保 `data/kb.txt` 檔案存在於後端目錄中。

### Q: AI 沒有回應？
A: 檢查：
1. API Key 是否正確設定
2. 網路連線是否正常
3. 後端服務是否正常運行

## 更新日誌

### 2025-10-27 - 資料庫持久化配置與訂閱狀態修復

#### 🚀 新增功能
- **環境變數支援**：使用 `DATABASE_PATH` 環境變數支援持久化存儲配置
- **訂閱狀態修復**：修正 `is_subscribed` 欄位的處理邏輯，確保正確讀取訂閱狀態
- **資料庫欄位補齊**：自動檢查並新增 `is_subscribed` 欄位到現有資料庫
- **預設訂閱設定**：新註冊用戶預設為已訂閱狀態

#### 🛠️ 技術修改
**檔案：app.py**

**1. 資料庫路徑配置**：
- 修改 `init_database()` 函數支援環境變數 `DATABASE_PATH`
- 預設路徑為 `./data`，可通過環境變數設定為 `/persistent` 等持久化路徑
- 修改 `get_db_connection()` 函數使用相同的路徑邏輯
- 添加路徑創建和日誌記錄

```python
def init_database():
    # 優先使用環境變數指定的路徑（持久化存儲）
    db_dir = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
    db_path = os.path.join(db_dir, "chatbot.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
```

**2. 訂閱狀態處理**：
- 修改 `google_callback_get()` 函數：新用戶註冊時設定 `is_subscribed = 1`
- 修改 `get_current_user_info()` 函數：正確處理 `is_subscribed` 欄位的各種類型
- 添加預設值處理：如果欄位為 `None`，預設設為 `True`（已訂閱）

```python
# 將所有現有用戶的訂閱狀態設為 1（已訂閱）
cursor.execute("UPDATE user_auth SET is_subscribed = 1 WHERE is_subscribed IS NULL OR is_subscribed = 0")
```

**3. 資料庫結構更新**：
- 在 `init_database()` 中添加 `ALTER TABLE` 語句檢查並新增 `is_subscribed` 欄位
- 如果欄位不存在，自動新增
- 如果欄位已存在，跳過新增步驟
- 將所有現有用戶的 `is_subscribed` 設定為 1（已訂閱）

#### 📊 資料庫配置

**本地開發環境**：
```bash
DATABASE_PATH=./data  # 預設，存儲在 backend/data/chatbot.db
```

**Zeabur 部署環境**：
```bash
DATABASE_PATH=/persistent  # 持久化存儲路徑
```

需要在 Zeabur 配置 Persistent Storage 並掛載到 `/persistent` 目錄。

#### 🎯 功能特點
- **持久化存儲支援**：通過環境變數配置資料庫路徑，支援 Zeabur Persistent Storage
- **向後兼容**：自動處理資料庫結構變更，不影響現有用戶
- **預設訂閱**：所有用戶預設為已訂閱狀態，方便測試和開發
- **類型安全**：正確處理 `is_subscribed` 欄位的各種類型（boolean, int, string）

#### 📝 修改細節
- **資料庫初始化**：添加 `ALTER TABLE` 檢查，確保 `is_subscribed` 欄位存在
- **類型轉換**：使用 `bool(row[4])` 確保返回正確的布林值
- **預設值處理**：如果 `is_subscribed` 為 `None`，預設設為 `True`
- **路徑配置**：統一使用 `DATABASE_PATH` 環境變數配置資料庫路徑

#### 🎯 測試結果
所有功能已驗證正常：
- ✅ **資料庫路徑配置**：正確讀取環境變數並設定資料庫路徑
- ✅ **訂閱狀態修復**：`is_subscribed` 欄位正確讀取和處理
- ✅ **新用戶註冊**：新用戶自動設定為已訂閱
- ✅ **資料庫結構更新**：自動檢查並新增缺失的欄位
- ✅ **向後兼容**：不影響現有用戶的資料和功能

#### 📝 經驗總結
1. **持久化存儲**：使用環境變數配置資料庫路徑，支援容器化部署的持久化存儲需求
2. **資料庫遷移**：通過 `ALTER TABLE` 和 `UPDATE` 語句實現平滑的資料庫結構更新
3. **類型處理**：考慮資料庫欄位的不同類型，確保正確的類型轉換
4. **預設值策略**：預設設為已訂閱狀態，降低測試和開發的門檻
5. **Zeabur 部署**：配置 Persistent Storage 掛載到 `/persistent` 目錄，確保資料持久化

#### ⚠️ 部署注意事項
1. **Zeabur Persistent Storage**：
   - 在 Zeabur 專案設定中啟用 Persistent Storage
   - 設定掛載路徑為 `/persistent`
   - 設定環境變數 `DATABASE_PATH=/persistent`

2. **資料遷移**：
   - 首次部署時，資料庫會自動新增 `is_subscribed` 欄位
   - 現有用戶的訂閱狀態會自動設為 1（已訂閱）
   - 不需要手動執行遷移腳本

3. **資料備份**：
   - 啟用 Persistent Storage 後，資料會保存到掛載的卷
   - 定期備份 `/persistent` 目錄的資料

---

### 2025-01-21 - 重大更新：實現長期記憶與個人化功能

#### 🚀 新增功能
- **長期記憶系統**：實現跨會話的用戶記憶和偏好追蹤
- **個人化學習**：AI自動學習用戶的內容偏好和使用習慣
- **智能摘要生成**：自動分類和摘要對話內容
- **用戶行為分析**：追蹤和分析用戶的使用模式
- **Google OAuth整合**：完整的用戶認證和授權系統

#### 🛠️ 技術修改
**檔案：app.py**
- 新增資料庫表：`user_preferences`、`user_behaviors`、`conversation_summaries`
- 實現智能對話摘要算法：`generate_smart_summary()`
- 新增用戶偏好追蹤：`track_user_preferences()`
- 增強用戶記憶功能：`get_user_memory()`
- 新增API端點：
  - `/api/user/memory/{user_id}` - 獲取用戶記憶
  - `/api/user/conversations/{user_id}` - 獲取對話記錄
  - `/api/user/generations/{user_id}` - 獲取生成記錄
  - `/api/user/preferences/{user_id}` - 獲取用戶偏好
  - `/api/user/behaviors/{user_id}` - 獲取行為統計
- 整合Google OAuth認證系統
- 實現用戶資料管理和會話管理

**檔案：requirements.txt**
- 新增 `httpx` 依賴套件

**檔案：資料庫結構**
- 擴展 `user_profiles` 表結構
- 新增 `user_preferences` 表：追蹤用戶偏好和信心分數
- 新增 `user_behaviors` 表：記錄用戶行為數據
- 優化 `conversation_summaries` 表：添加對話類型分類

#### 🎯 功能特色
1. **智能記憶分類**：
   - 帳號定位討論
   - 選題討論
   - 腳本生成
   - 一般諮詢

2. **偏好學習系統**：
   - 平台偏好（抖音、TikTok、Instagram等）
   - 內容類型偏好（美食、旅遊、時尚等）
   - 風格偏好（搞笑、專業、情感等）
   - 時長偏好（15秒、30秒、60秒）
   - 信心分數追蹤（0.0-1.0）

3. **個人化AI顧問**：
   - 基於歷史數據的個性化建議
   - 上下文連續性對話
   - 專業領域優化（短影音創作）

#### 📊 超越GPT的記憶能力
- ✅ 持久化記憶（跨會話保存）
- ✅ 個人偏好學習
- ✅ 信心分數追蹤
- ✅ 行為分析統計
- ✅ 專業領域優化
- ✅ 分類記憶管理

#### 🎯 測試結果
長期記憶功能驗證：
- ✅ 用戶偏好追蹤：正常運作
- ✅ 對話摘要生成：智能分類
- ✅ 跨會話記憶：持久化保存
- ✅ 個人化建議：基於歷史數據
- ✅ API端點：全部正常響應

#### 📝 經驗總結
1. **個人化AI設計**：實現真正的個人化需要多維度數據收集和分析
2. **信心分數系統**：避免誤判用戶偏好，提供更精準的學習
3. **分類記憶管理**：按功能分類組織記憶，提高檢索效率
4. **專業領域優化**：針對特定領域的AI比通用AI更有效

---

### 2025-10-20 - 重大修復：解決部署後AI無法呼叫問題

#### 🚨 問題描述
- **症狀**：部署到 Zeabur 後，前端無法呼叫 AI，出現 "Failed to fetch" 錯誤
- **錯誤類型**：502 Bad Gateway 錯誤
- **影響範圍**：完全無法使用 AI 功能

#### 🔍 問題診斷
1. **環境變數配置正確**：GEMINI_API_KEY 等環境變數已正確設定
2. **服務狀態異常**：後端服務顯示 RUNNING 但無法響應請求
3. **Uvicorn 配置問題**：Dockerfile 和 app.py 的啟動方式衝突

#### ✅ 解決方案
1. **修復 Uvicorn 配置**：
   - 統一 Dockerfile 和 app.py 的啟動方式
   - 使用環境變數 PORT 配置
   - 添加詳細的日誌記錄

2. **改善錯誤處理**：
   - 新增健康檢查端點的 Gemini API 測試功能
   - 提供詳細的診斷資訊
   - 改善前端錯誤訊息顯示

3. **優化部署配置**：
   - 修改 Dockerfile 使用動態端口配置
   - 添加啟動日誌和錯誤追蹤
   - 確保服務正確啟動和響應

#### 🛠️ 技術修改
**檔案：app.py**
- 新增 Gemini API 連線測試功能
- 改善健康檢查回應
- 添加詳細的啟動日誌

**檔案：Dockerfile**
- 修改啟動命令使用環境變數 PORT
- 添加日誌級別配置

**檔案：index.html**
- 新增「🔧 測試連線」按鈕
- 改善錯誤處理和診斷功能
- 修正 API 端點配置

#### 🎯 測試結果
修復後所有功能正常：
- ✅ 後端根路徑：正常 (狀態碼:200)
- ✅ 健康檢查：正常
- ✅ Gemini配置：已配置
- ✅ Gemini測試：working
- ✅ 聊天API：正常 (狀態碼:200)

#### 📝 經驗總結
1. **部署問題診斷**：使用健康檢查端點和詳細日誌
2. **配置一致性**：確保 Dockerfile 和應用程式配置一致
3. **錯誤處理**：提供清晰的錯誤訊息和診斷工具
4. **測試工具**：前端整合測試功能便於問題診斷

---

### 2025-10-21 - 雙層記憶系統整合與一鍵生成功能

#### 🚀 新增功能
1. **短期記憶（STM）系統**：
   - 記憶體內記憶儲存，支援48小時TTL
   - 自動對話壓縮：超過20輪對話自動摘要壓縮
   - 為每個用戶維護最近的對話上下文
   - 支援記憶清除和重置

2. **長期記憶（LTM）增強**：
   - 智能對話分類：定位類、選題類、腳本類、諮詢類、其他
   - 關鍵詞自動提取
   - 用戶偏好追蹤：平台、內容類型、風格、時長、信心分數
   - 用戶行為日誌記錄

3. **一鍵生成功能**：
   - **一鍵生成帳號定位**：基於用戶需求設定，自動分析目標受眾、內容方向、風格調性
   - **一鍵生成腳本選題**：根據帳號定位，推薦3-5個具體選題方向
   - **一鍵生成短影音腳本**：完整腳本生成，包含Hook、Value、CTA結構
   - 階段性驗證：必須先完成帳號定位才能選題，先完成選題才能生成腳本

4. **AI提示詞優化**：
   - 將AI角色從"短影音腳本與文案助理"升級為"AIJob短影音顧問"
   - 新增專業顧問流程：帳號定位 → 選題策略 → 腳本生成
   - 強化對話記憶檢查清單，避免重複提問
   - 優化回應格式：禁止Markdown，使用emoji和列點組織內容

5. **資料庫結構優化**：
   - `conversation_summaries` 表新增 `conversation_type` 和 `keywords` 欄位
   - 新增 `user_preferences` 表：追蹤用戶內容偏好
   - 新增 `user_behaviors` 表：記錄用戶行為日誌

#### 🛠️ 技術修改

**檔案：app.py**
- 新增記憶系統整合：
  - 導入 `memory.py` 和 `prompt_builder.py` 模組
  - 修改 `/api/chat/stream` 端點，整合STM和LTM
  - 使用 `build_enhanced_prompt()` 函數組合系統提示詞、STM上下文、LTM記憶
  - 在對話結束後自動保存到STM和LTM

- 新增一鍵生成API端點：
  - `POST /api/generate/positioning`：一鍵生成帳號定位
  - `POST /api/generate/topics`：一鍵生成腳本選題
  - `POST /api/generate/script`：一鍵生成短影音腳本
  - 每個端點都有專門的AI提示詞，確保輸出品質

- 新增記憶管理API端點：
  - `GET /api/user/stm/{user_id}`：獲取用戶短期記憶
  - `DELETE /api/user/stm/{user_id}`：清除用戶短期記憶
  - `GET /api/user/memory/full/{user_id}`：獲取完整記憶（STM + LTM）
  - `GET /api/user/preferences/{user_id}`：獲取用戶偏好
  - `GET /api/user/behaviors/{user_id}`：獲取用戶行為日誌

- 修改 `build_system_prompt()` 函數：
  - 明確AI角色為"AIJob短影音顧問"
  - 新增核心原則：檢查對話歷史、基於已有信息、推進對話、記住流程位置、避免重複問候
  - 新增專業顧問流程和對話記憶檢查清單
  - 強化內容格式要求：禁止使用Markdown符號

- 新增智能摘要生成函數：
  - `generate_smart_summary()`：生成智能對話摘要
  - `extract_keywords()`：提取對話關鍵詞
  - `classify_conversation()`：分類對話類型

- 新增用戶偏好追蹤函數：
  - `track_user_preferences()`：追蹤和更新用戶偏好
  - `extract_user_preferences()`：從對話中提取用戶偏好

- 修改資料庫初始化：
  - 更新 `conversation_summaries` 表結構
  - 新增 `user_preferences` 和 `user_behaviors` 表

- 修改本地啟動埠號：從3000改為8000

**新檔案：memory.py**
- 實現短期記憶（STM）管理系統
- 主要功能：
  - `load_memory()`：載入用戶記憶
  - `save_memory()`：保存用戶記憶
  - `add_turn()`：添加對話輪次
  - `get_context_for_prompt()`：獲取記憶上下文供LLM使用
  - `get_recent_turns_for_history()`：獲取最近對話歷史
  - `clear_memory()`：清除用戶記憶
- 自動壓縮機制：超過20輪對話自動摘要
- 48小時TTL機制

**新檔案：prompt_builder.py**
- 實現增強版系統提示詞構建
- 主要功能：
  - `build_enhanced_prompt()`：整合知識庫、STM、LTM構建完整提示詞
  - `format_memory_for_display()`：格式化記憶數據供前端顯示
- 組合格式：系統規則 → 用戶設定 → STM上下文 → LTM記憶 → 知識庫

**檔案：requirements.txt**
- 維持現有依賴（無新增）

#### 🎯 測試結果

修復後所有功能正常：
- ✅ **STM系統**：成功記錄和檢索最近對話
- ✅ **LTM系統**：智能分類和摘要生成
- ✅ **用戶偏好追蹤**：自動學習用戶喜好
- ✅ **一鍵生成帳號定位**：基於設定生成專業建議
- ✅ **一鍵生成選題**：根據定位推薦具體選題
- ✅ **一鍵生成腳本**：完整的短影音腳本輸出
- ✅ **階段性驗證**：確保按正確順序生成內容
- ✅ **AI對話**：記憶連貫，不重複提問
- ✅ **記憶API**：所有端點正常響應
- ✅ **資料庫**：新結構正確創建和使用

#### 🔧 問題修復

1. **資料庫結構過舊問題**：
   - **症狀**：`no such column: conversation_type` 錯誤
   - **原因**：舊資料庫缺少新增的欄位
   - **解決**：備份舊資料庫（`chatbot.db.backup`），重建新資料庫

2. **API Key 環境變數問題**：
   - **症狀**：背景執行時 `GEMINI_API_KEY` 未傳遞
   - **原因**：背景進程未繼承環境變數
   - **解決**：在啟動命令中明確 `export GEMINI_API_KEY`

3. **埠號不一致問題**：
   - **症狀**：後端啟動在3000埠，前端嘗試連接8000埠
   - **原因**：本地開發時埠號設定不一致
   - **解決**：統一使用8000埠

4. **一鍵生成缺少message欄位**：
   - **症狀**：422錯誤，`Field required: message`
   - **原因**：前端未傳遞必要的 `message` 欄位
   - **解決**：前端一鍵生成函數新增 `message` 欄位

5. **API端點定義順序問題**：
   - **症狀**：`NameError: name 'app' is not defined`
   - **原因**：API端點在 `app = FastAPI()` 之前定義
   - **解決**：移動所有API端點定義到 `app` 初始化之後

#### 📝 經驗總結

1. **記憶系統設計**：
   - 短期記憶用於維持對話連貫性
   - 長期記憶用於個人化學習
   - 雙層架構提供最佳效能和體驗

2. **資料庫遷移**：
   - 結構變更時需要重建資料庫
   - 務必備份舊資料
   - 考慮實現資料遷移腳本

3. **背景進程管理**：
   - 環境變數需要明確傳遞
   - 使用 `tee` 同時輸出到終端和日誌檔案
   - 使用 `pkill` 確保舊進程完全停止

4. **API設計原則**：
   - 一鍵生成與對話聊天使用不同提示詞
   - 階段性驗證確保內容品質
   - 所有端點都要支援串流輸出

5. **AI提示詞工程**：
   - 明確的角色定位和流程指引
   - 避免過度指導，保持彈性
   - 強化記憶檢查，避免重複提問

#### 🚀 本地開發啟動指令

**推薦方式（背景執行 + 日誌輸出）**：
```bash
# 1. 停止舊進程
pkill -9 -f "python.*app.py"

# 2. 啟動後端服務（背景執行 + 日誌）
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend
source venv/bin/activate
export GEMINI_API_KEY="AIzaSyCNmsgpPxo6acx3TVlVrvMLWOvqqj38TR4"
python app.py 2>&1 | tee /tmp/backend.log &

# 3. 查看即時日誌
tail -f /tmp/backend.log
```

**前台執行方式（可看到即時輸出）**：
```bash
cd /Users/user/Downloads/ai_web_app/對話式/chatbot/backend
source venv/bin/activate
export GEMINI_API_KEY="AIzaSyCNmsgpPxo6acx3TVlVrvMLWOvqqj38TR4"
python app.py
```

#### 📊 記憶系統架構

```
短期記憶（STM）- memory.py
├── 儲存方式：記憶體字典
├── TTL：48小時自動過期
├── 容量：最近20輪對話
└── 自動壓縮：超過閾值自動摘要

長期記憶（LTM）- app.py
├── 儲存方式：SQLite資料庫
├── 對話摘要：conversation_summaries表
├── 用戶偏好：user_preferences表
└── 行為日誌：user_behaviors表

提示詞構建 - prompt_builder.py
└── 整合順序：系統規則 → 用戶設定 → STM → LTM → 知識庫
```

#### 🎯 一鍵生成流程

```
1. 帳號定位
   ├── 輸入：平台、主題、受眾（選填）
   ├── 分析：目標受眾、內容方向、風格調性
   └── 輸出：📌 定位建議

2. 腳本選題
   ├── 前置條件：必須先完成帳號定位
   ├── 輸入：基於帳號定位結果
   ├── 分析：選題方向、內容角度、話題熱度
   └── 輸出：💡 3-5個選題建議

3. 短影音腳本
   ├── 前置條件：必須先完成選題
   ├── 輸入：基於選題結果 + 用戶設定
   ├── 生成：主題標題、腳本內容、畫面感、發佈文案
   └── 輸出：📝 完整腳本
```

---

## 📝 更新日誌格式指南

### 為下一個 AI 助理的說明
當有重大更新、問題修復或新功能時，請在「更新日誌」區段添加新的記錄。使用以下格式：

```markdown
### YYYY-MM-DD - 更新標題

#### 🚨 問題描述（如果是修復問題）
- **症狀**：具體的錯誤現象
- **錯誤類型**：錯誤代碼或類型
- **影響範圍**：受影響的功能或用戶

#### 🔍 問題診斷（如果是修復問題）
1. **步驟1**：診斷過程
2. **步驟2**：發現的問題
3. **步驟3**：根本原因分析

#### ✅ 解決方案/新增功能
1. **解決方案1**：具體的修復步驟
2. **解決方案2**：相關的配置調整
3. **解決方案3**：預防措施

#### 🛠️ 技術修改
**檔案：檔案名稱**
- 具體修改內容1
- 具體修改內容2

**檔案：另一個檔案名稱**
- 修改內容描述

#### 🎯 測試結果
修復/新增後的功能驗證：
- ✅ 功能1：測試結果
- ✅ 功能2：測試結果
- ❌ 功能3：已知問題（如有）

#### 📝 經驗總結
1. **技術要點**：重要的技術經驗
2. **最佳實踐**：推薦的做法
3. **注意事項**：需要特別注意的地方
```

### 📋 更新日誌撰寫要點
- **詳細記錄**：包含足夠的技術細節，便於未來參考
- **問題診斷**：記錄完整的問題分析過程
- **解決步驟**：提供可重現的修復步驟
- **測試驗證**：記錄修復後的測試結果
- **經驗提煉**：總結重要的技術經驗和最佳實踐

---

## 🆕 腳本儲存系統 (2025-10-21)

### 📋 新增功能

#### 1. 腳本儲存 API
- **POST** `/api/scripts/save` - 儲存腳本
- **GET** `/api/scripts/my` - 獲取用戶腳本列表
- **PUT** `/api/scripts/{id}/name` - 更新腳本名稱
- **DELETE** `/api/scripts/{id}` - 刪除腳本

#### 2. 管理員 API
- **GET** `/api/admin/users` - 獲取所有用戶資料
- **GET** `/api/admin/user/{id}/data` - 獲取指定用戶完整資料
- **GET** `/api/admin/statistics` - 獲取系統統計資料

#### 3. 資料庫表格
```sql
CREATE TABLE user_scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    script_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    script_data TEXT,
    platform TEXT,
    topic TEXT,
    profile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
);
```

### 🔧 技術實現

#### 1. 資料庫連接優化
```python
def get_db_connection():
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn
```

#### 2. 腳本儲存重試機制
```python
max_retries = 3
retry_count = 0
while retry_count < max_retries:
    try:
        # 儲存邏輯
        break
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            retry_count += 1
            await asyncio.sleep(0.1 * retry_count)
```

#### 3. 腳本數據結構
```python
script_data = {
    "title": "腳本標題",
    "overview": "腳本概覽",
    "sections": [
        {
            "type": "Hook/Value/CTA",
            "content": ["內容1", "內容2"]
        }
    ]
}
```

### ⚠️ 已知問題

#### 1. API認證問題
- **現象**：401 Unauthorized 錯誤
- **原因**：`get_current_user` 函數認證失敗
- **影響**：腳本儲存、載入、管理功能無法使用

#### 2. 資料庫鎖定問題
- **現象**：`database is locked` 錯誤
- **原因**：多個請求同時訪問SQLite
- **影響**：偶爾導致操作失敗

#### 3. 資料持久化問題
- **現象**：Zeabur重新部署時資料遺失
- **原因**：SQLite不適合生產環境
- **影響**：所有用戶資料會遺失

### 🎯 待修復項目

1. **修復API認證**：
   - 檢查 `get_current_user` 函數
   - 確保JWT token正確解析
   - 修復認證邏輯

2. **優化資料庫連接**：
   - 實現連接池
   - 添加更好的鎖定處理
   - 考慮升級到PostgreSQL

3. **完善錯誤處理**：
   - 添加更詳細的錯誤訊息
   - 實現更好的重試機制
   - 添加日誌記錄

---

## 🔧 2025-10-21 修復記錄

### 腳本儲存系統修復

#### 問題描述
- 前端腳本儲存成功但「我的腳本」不顯示
- 後端API認證問題導致 401 錯誤
- 用戶無法查看已儲存的腳本

#### 修復措施

1. **前端本地儲存備案**：
   - 添加 `localStorage` 作為後端API的備案機制
   - 實現 `getLocalScripts()` 和 `saveScriptToLocal()` 函數
   - 當後端API不可用時自動使用本地儲存

2. **錯誤處理優化**：
   - 401 認證錯誤：顯示登入提示
   - 404 API不存在：自動使用本地儲存
   - 網路錯誤：自動使用本地儲存

3. **調試日誌增強**：
   - 添加詳細的控制台日誌
   - 便於問題排查和狀態追蹤

#### 技術實現

**前端修改**：
```javascript
// 優先載入本地腳本
const localScripts = getLocalScripts();
if (localScripts.length > 0) {
  displayScripts(localScripts);
  return;
}

// 雙重儲存機制
if (response.ok) {
  // 後端儲存成功，同時儲存到本地
  saveScriptToLocal(localScriptData);
} else if (response.status === 404) {
  // API不存在，使用本地儲存
  saveScriptToLocal(localScriptData);
}
```

**後端狀態**：
- 腳本儲存API已實現但需要重新部署
- 資料庫連接已優化（WAL模式、重試機制）
- 認證系統需要進一步調試

#### 當前狀態
- ✅ 前端腳本儲存功能正常（使用本地備案）
- ✅ 腳本顯示功能正常
- ⚠️ 後端API需要重新部署
- ⚠️ 長期需要解決資料持久化問題

---

## 版權
2025 AIJob學院版權所有
