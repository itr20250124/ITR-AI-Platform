FROM node:18-alpine

WORKDIR /app

# 複製package.json和package-lock.json
COPY frontend/package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY frontend/ .
COPY shared/ ../shared/

# 暴露端口
EXPOSE 3000

# 啟動開發服務器
CMD ["npm", "run", "dev", "--", "--host"]