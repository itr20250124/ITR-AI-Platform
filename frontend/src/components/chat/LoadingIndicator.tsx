import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = '正在思考...',
  className = '',
}) => {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[80%]">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* AI頭像 */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
              🤖
            </div>
            
            {/* 載入動畫和文字 */}
            <div className="flex items-center space-x-2">
              {/* 跳動的點 */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div 
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div 
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              
              {/* 載入文字 */}
              <span className="text-sm text-gray-600">{message}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};