#!/bin/bash

# 多功能AI平台測試運行腳本

set -e

echo "🧪 開始運行測試套件..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印帶顏色的消息
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查Node.js和npm
print_status "檢查環境..."
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安裝"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm 未安裝"
    exit 1
fi

print_success "環境檢查通過"

# 安裝依賴
print_status "安裝後端依賴..."
cd backend
npm install
print_success "後端依賴安裝完成"

print_status "安裝前端依賴..."
cd ../frontend
npm install
print_success "前端依賴安裝完成"

cd ..

# 運行後端測試
print_status "運行後端單元測試..."
cd backend
if npm run test; then
    print_success "後端單元測試通過"
else
    print_error "後端單元測試失敗"
    exit 1
fi

# 運行後端測試覆蓋率
print_status "生成後端測試覆蓋率報告..."
if npm run test:coverage; then
    print_success "後端測試覆蓋率報告生成完成"
else
    print_warning "後端測試覆蓋率報告生成失敗"
fi

cd ..

# 運行前端測試
print_status "運行前端單元測試..."
cd frontend
if npm run test; then
    print_success "前端單元測試通過"
else
    print_error "前端單元測試失敗"
    exit 1
fi

# 運行前端測試覆蓋率
print_status "生成前端測試覆蓋率報告..."
if npm run test:coverage; then
    print_success "前端測試覆蓋率報告生成完成"
else
    print_warning "前端測試覆蓋率報告生成失敗"
fi

cd ..

# 運行端到端測試（可選）
if [ "$1" = "--e2e" ]; then
    print_status "運行端到端測試..."
    print_warning "端到端測試需要有效的API密鑰"
    
    cd backend
    if npm run test:e2e; then
        print_success "端到端測試通過"
    else
        print_warning "端到端測試失敗（可能需要API密鑰）"
    fi
    cd ..
fi

# 測試總結
print_success "🎉 所有測試完成！"
echo ""
echo "📊 測試報告位置："
echo "   後端覆蓋率: backend/coverage/lcov-report/index.html"
echo "   前端覆蓋率: frontend/coverage/lcov-report/index.html"
echo ""
echo "💡 提示："
echo "   - 使用 --e2e 參數運行端到端測試"
echo "   - 確保設置了必要的環境變數（API密鑰等）"
echo "   - 查看覆蓋率報告以了解測試覆蓋情況"