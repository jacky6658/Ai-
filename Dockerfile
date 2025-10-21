FROM python:3.11-slim

# 設定工作目錄
WORKDIR /app

# 複製前端檔案
COPY . .

# 暴露端口
EXPOSE 8080

# 啟動 Python HTTP 伺服器
CMD ["python", "-m", "http.server", "8080"]
