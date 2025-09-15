import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Container, Grid, GridItem, Card, Button } from './components';
import { ThemeToggle } from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Container>
          <div className="py-8">
            {/* Header */}
            <header className="text-center mb-8 relative">
              <div className="absolute top-0 right-0">
                <ThemeToggle />
              </div>
              
              <h1 className="text-4xl font-bold text-gradient mb-4">
                多功能AI平台
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                整合多種AI服務的現代化平台
              </p>
            </header>
            
            {/* Main Content */}
            <main>
              <Card variant="elevated" className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  歡迎使用AI平台
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  專案基礎架構已建立完成，主題系統和UI組件已就緒
                </p>
                
                <div className="flex justify-center gap-4">
                  <Button variant="primary">
                    開始使用
                  </Button>
                  <Button variant="outline">
                    了解更多
                  </Button>
                </div>
              </Card>

              {/* Feature Cards */}
              <Grid cols={1} responsive={{ md: 3 }} gap="lg">
                <GridItem>
                  <Card variant="outlined" className="h-full">
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">
                        AI聊天
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        與GPT、Gemini等AI模型進行智能對話
                      </p>
                    </div>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card variant="outlined" className="h-full">
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-4">🎨</div>
                      <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        圖片生成
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        使用AI創造精美的圖片作品
                      </p>
                    </div>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card variant="outlined" className="h-full">
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-4">🎬</div>
                      <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                        影片生成
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        生成動態影片內容
                      </p>
                    </div>
                  </Card>
                </GridItem>
              </Grid>

              {/* Status Section */}
              <Card className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  開發狀態
                </h3>
                <Grid cols={1} responsive={{ md: 2 }} gap="md">
                  <GridItem>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        專案基礎架構
                      </span>
                    </div>
                  </GridItem>
                  <GridItem>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        用戶認證系統
                      </span>
                    </div>
                  </GridItem>
                  <GridItem>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        主題系統
                      </span>
                    </div>
                  </GridItem>
                  <GridItem>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        UI組件庫
                      </span>
                    </div>
                  </GridItem>
                </Grid>
              </Card>
            </main>
          </div>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;