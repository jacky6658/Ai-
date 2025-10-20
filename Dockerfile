FROM nginx:alpine

# 複製前端檔案
COPY . /usr/share/nginx/html

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8080

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]
