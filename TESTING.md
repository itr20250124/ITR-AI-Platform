# 測試文檔

本文檔描述了多功能AI平台的測試策略、測試結構和如何運行測試。

## 📋 測試概覽

我們的測試策略包括三個層次：

1. **單元測試** - 測試個別函數和組件
2. **整合測試** - 測試API端點和服務整合
3. **端到端測試** - 測試完整的用戶工作流程

## 🏗️ 測試架構

### 後端測試結構
```
backend/src/
├── __tests__/
│   ├── setup.ts                    # 測試環境設置
│   └── imageGeneration.e2e.test.ts # 端到端測試
├── controllers/__tests__/
│   └── aiController.test.ts        # 控制器單元測試
├── services/ai/providers/__tests__/
│   └── OpenAIImageService.test.ts  # AI服務單元測試
└── routes/__tests__/
    └── imageRoutes.test.ts         # 路由整合測試
```

### 前端測試結構
```
frontend/src/
├── __tests__/
│   └── setup.ts                    # 測試環境設置
├── services/__tests__/
│   └── imageService.test.ts        # 服務單元測試
└── components/image/__tests__/
    ├── ImageGenerator.test.tsx     # 組件單元測試
    └── ImagePreview.test.tsx       # 組件單元測試
```

## 🧪 測試類型

### 1. 單元測試

#### 後端單元測試
- **控制器測試**: 測試API控制器的邏輯和錯誤處理
- **服務測試**: 測試AI服務的功能和參數驗證
- **工具函數測試**: 測試輔助函數和工具類

#### 前端單元測試
- **組件測試**: 測試React組件的渲染和交互
- **服務測試**: 測試前端服務類的API調用
- **工具函數測試**: 測試輔助函數和工具類

### 2. 整合測試

- **API端點測試**: 測試完整的HTTP請求/響應流程
- **資料庫整合**: 測試與資料庫的交互
- **外部服務整合**: 測試與AI服務的整合（使用模擬）

### 3. 端到端測試

- **完整工作流程**: 測試從用戶輸入到最終結果的完整流程
- **錯誤處理**: 測試各種錯誤情況的處理
- **性能測試**: 測試系統在負載下的表現

## 🚀 運行測試

### 快速開始

使用我們提供的測試腳本：

```bash
# Linux/Mac
./scripts/run-tests.sh

# Windows
scripts\run-tests.bat
```

### 手動運行

#### 後端測試
```bash
cd backend

# 運行所有測試
npm test

# 監視模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage

# 只運行端到端測試
npm run test:e2e
```

#### 前端測試
```bash
cd frontend

# 運行所有測試
npm test

# 監視模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage

# 只運行UI組件測試
npm run test:ui
```

## 📊 測試覆蓋率

我們的目標是達到以下測試覆蓋率：

- **語句覆蓋率**: > 80%
- **分支覆蓋率**: > 75%
- **函數覆蓋率**: > 85%
- **行覆蓋率**: > 80%

### 查看覆蓋率報告

運行測試後，可以在以下位置查看詳細的覆蓋率報告：

- 後端: `backend/coverage/lcov-report/index.html`
- 前端: `frontend/coverage/lcov-report/index.html`

## 🔧 測試配置

### Jest 配置

#### 後端 (backend/jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
};
```

#### 前端 (frontend/jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
```

## 🎯 測試最佳實踐

### 1. 測試命名
- 使用描述性的測試名稱
- 遵循 "should [expected behavior] when [condition]" 格式
- 使用中文描述以提高可讀性

### 2. 測試結構
- 使用 AAA 模式 (Arrange, Act, Assert)
- 每個測試只測試一個功能點
- 保持測試的獨立性

### 3. 模擬 (Mocking)
- 模擬外部依賴（API、資料庫等）
- 使用 Jest 的模擬功能
- 避免測試中的真實API調用

### 4. 測試數據
- 使用工廠函數創建測試數據
- 保持測試數據的簡潔性
- 避免硬編碼的測試數據

## 🐛 調試測試

### 常見問題

1. **測試超時**
   - 增加測試超時時間
   - 檢查異步操作是否正確處理

2. **模擬不工作**
   - 確保模擬在正確的位置
   - 檢查模擬的導入路徑

3. **DOM 相關錯誤**
   - 確保使用 jsdom 環境
   - 檢查測試設置文件

### 調試技巧

```javascript
// 在測試中添加調試信息
console.log('Debug info:', someVariable);

// 使用 Jest 的調試模式
npm test -- --verbose

// 運行特定測試文件
npm test -- ImageGenerator.test.tsx
```

## 📈 持續整合

### GitHub Actions

我們使用 GitHub Actions 進行持續整合：

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

### 測試報告

- 測試結果會自動上傳到CI/CD平台
- 覆蓋率報告會生成並存檔
- 失敗的測試會阻止部署

## 🔄 測試維護

### 定期任務

1. **更新測試依賴**: 定期更新測試框架和工具
2. **審查測試覆蓋率**: 確保新功能有適當的測試
3. **清理過時測試**: 移除不再需要的測試
4. **性能優化**: 優化慢速測試

### 測試重構

當代碼重構時，相應地更新測試：

1. 保持測試與實現的同步
2. 重構重複的測試代碼
3. 改進測試的可讀性和維護性

## 📚 相關資源

- [Jest 官方文檔](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest 文檔](https://github.com/visionmedia/supertest)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🤝 貢獻測試

如果您想為測試做出貢獻：

1. 為新功能編寫測試
2. 改進現有測試的覆蓋率
3. 報告和修復測試中的問題
4. 改進測試文檔

記住：好的測試是高質量軟件的基礎！🎯