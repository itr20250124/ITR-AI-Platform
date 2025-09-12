FROM node:18-alpine

WORKDIR /app

# 複製package.json和package-lock.json
COPY backend/package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY backend/ .
COPY shared/ ../shared/

# 構建應用
RUN npm run build

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["npm", "start"]