# ITR-AI-Platform

多功能AI平台 - 一個整合多種AI服務提供商的現代化Web應用程序，支持聊天、圖片生成、影片生成等功能。

## 功能特色

- 🤖 **多AI模型支持** - 整合OpenAI GPT、Google Gemini等多種AI服務
- 🎨 **圖片生成** - 使用AI生成高品質圖片
- 🎬 **影片生成** - 創建AI生成的動態影片內容
- ⚙️ **參數自定義** - 用戶可調整AI參數控制輸出品質
- 🌙 **Dark模式** - 支持明暗主題切換
- 📱 **響應式設計** - 完美適配桌面和移動設備
- 🔐 **用戶系統** - 安全的用戶認證和偏好保存

## 技術架構

### 前端
- React 18 + TypeScript
- Tailwind CSS
- Zustand (狀態管理)
- React Query (數據獲取)
- Vite (構建工具)

### 後端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT認證

### AI服務整合
- OpenAI API (GPT模型、DALL-E)
- Google Gemini API
- 插件式架構支持未來擴展

## 快速開始

### 環境要求
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/itr20250124/ITR-AI-Platform.git
cd ITR-AI-Platform
```

2. **安裝依賴**
```bash
npm install
```

3. **配置環境變量**
```bash
cp .env.example .env
# 編輯 .env 文件，填入必要的配置
```

4. **設置數據庫**
```bash
cd backend
npm run db:migrate
npm run db:generate
```

5. **啟動開發服務器**
```bash
# 回到根目錄
cd ..
npm run dev
```

應用程序將在以下地址運行：
- 前端: http://localhost:3000
- 後端API: http://localhost:5000

## 專案結構

```
ITR-AI-Platform/
├── frontend/                 # React前端應用
│   ├── src/
│   │   ├── components/      # React組件
│   │   ├── hooks/          # 自定義Hooks
│   │   ├── services/       # API服務
│   │   ├── types/          # TypeScript類型
│   │   └── utils/          # 工具函數
│   └── public/             # 靜態資源
├── backend/                 # Node.js後端API
│   ├── src/
│   │   ├── controllers/    # API控制器
│   │   ├── services/       # 業務邏輯服務
│   │   ├── middleware/     # Express中間件
│   │   ├── types/          # TypeScript類型
│   │   └── utils/          # 工具函數
│   └── prisma/             # 數據庫模型和遷移
├── shared/                  # 前後端共享代碼
│   └── types/              # 共享類型定義
└── docs/                   # 文檔
```

## API文檔

### 認證端點
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出

### 聊天端點
- `POST /api/chat/send` - 發送聊天訊息
- `GET /api/chat/history/:conversationId` - 獲取對話歷史
- `DELETE /api/chat/conversation/:id` - 刪除對話

### 圖片生成端點
- `POST /api/image/generate` - 生成圖片
- `GET /api/image/:id` - 獲取圖片狀態
- `DELETE /api/image/:id` - 刪除圖片

### 影片生成端點
- `POST /api/video/generate` - 生成影片
- `GET /api/video/:id/status` - 獲取影片狀態
- `GET /api/video/:id/download` - 下載影片

## 開發指南

### 添加新的AI服務提供商

1. 在 `backend/src/services/ai/` 創建新的服務類
2. 實現 `AIServiceInterface` 介面
3. 在 `AIServiceFactory` 中註冊新服務
4. 更新前端的服務選擇器

### 測試

```bash
# 運行所有測試
npm run test

# 運行前端測試
npm run test:frontend

# 運行後端測試
npm run test:backend
```

### 構建生產版本

```bash
npm run build
```

## 部署

### Docker部署

```bash
# 構建Docker鏡像
docker-compose build

# 啟動服務
docker-compose up -d
```

## 貢獻指南

1. Fork專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟Pull Request

## 許可證

本專案採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 支持

如有問題或建議，請：
1. 查看 [文檔](docs/)
2. 搜索現有的 [Issues](../../issues)
3. 創建新的 Issue

---

**注意**: 使用本應用程序需要有效的AI服務API密鑰。請確保遵守各AI服務提供商的使用條款和限制。
