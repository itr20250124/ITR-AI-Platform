@echo off
setlocal enabledelayedexpansion

REM 多功能AI平台測試運行腳本 (Windows版本)

echo 🧪 開始運行測試套件...

REM 檢查Node.js和npm
echo [INFO] 檢查環境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安裝
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm 未安裝
    exit /b 1
)

echo [SUCCESS] 環境檢查通過

REM 安裝後端依賴
echo [INFO] 安裝後端依賴...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 後端依賴安裝失敗
    exit /b 1
)
echo [SUCCESS] 後端依賴安裝完成

REM 安裝前端依賴
echo [INFO] 安裝前端依賴...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 前端依賴安裝失敗
    exit /b 1
)
echo [SUCCESS] 前端依賴安裝完成

cd ..

REM 運行後端測試
echo [INFO] 運行後端單元測試...
cd backend
call npm run test
if %errorlevel% neq 0 (
    echo [ERROR] 後端單元測試失敗
    exit /b 1
)
echo [SUCCESS] 後端單元測試通過

REM 運行後端測試覆蓋率
echo [INFO] 生成後端測試覆蓋率報告...
call npm run test:coverage
if %errorlevel% neq 0 (
    echo [WARNING] 後端測試覆蓋率報告生成失敗
) else (
    echo [SUCCESS] 後端測試覆蓋率報告生成完成
)

cd ..

REM 運行前端測試
echo [INFO] 運行前端單元測試...
cd frontend
call npm run test
if %errorlevel% neq 0 (
    echo [ERROR] 前端單元測試失敗
    exit /b 1
)
echo [SUCCESS] 前端單元測試通過

REM 運行前端測試覆蓋率
echo [INFO] 生成前端測試覆蓋率報告...
call npm run test:coverage
if %errorlevel% neq 0 (
    echo [WARNING] 前端測試覆蓋率報告生成失敗
) else (
    echo [SUCCESS] 前端測試覆蓋率報告生成完成
)

cd ..

REM 運行端到端測試（可選）
if "%1"=="--e2e" (
    echo [INFO] 運行端到端測試...
    echo [WARNING] 端到端測試需要有效的API密鑰
    
    cd backend
    call npm run test:e2e
    if %errorlevel% neq 0 (
        echo [WARNING] 端到端測試失敗（可能需要API密鑰）
    ) else (
        echo [SUCCESS] 端到端測試通過
    )
    cd ..
)

REM 測試總結
echo.
echo [SUCCESS] 🎉 所有測試完成！
echo.
echo 📊 測試報告位置：
echo    後端覆蓋率: backend\coverage\lcov-report\index.html
echo    前端覆蓋率: frontend\coverage\lcov-report\index.html
echo.
echo 💡 提示：
echo    - 使用 --e2e 參數運行端到端測試
echo    - 確保設置了必要的環境變數（API密鑰等）
echo    - 查看覆蓋率報告以了解測試覆蓋情況

endlocal