import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            多功能AI平台
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            整合多種AI服務的現代化平台
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              歡迎使用AI平台
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              專案基礎架構已建立完成，準備開始開發各項功能
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <h3 className="font-semibold text-primary-700 dark:text-primary-300">
                  💬 AI聊天
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  與GPT、Gemini等AI模型對話
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                  🎨 圖片生成
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  使用AI創造精美圖片
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  🎬 影片生成
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  生成動態影片內容
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App