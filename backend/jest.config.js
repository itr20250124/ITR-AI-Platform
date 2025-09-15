module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 只運行我們新創建的測試文件
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/services/ai/__tests__/GeminiIntegration.test.ts',
    'src/services/ai/__tests__/OpenAIIntegration.test.ts',
    'src/services/ai/providers/__tests__/GeminiChatService.test.ts',
    'src/services/ai/providers/__tests__/OpenAIChatService.test.ts',
    'src/services/conversation/__tests__/ConversationService.test.ts',
    'src/services/parameters/__tests__/ParameterService.test.ts',
    'src/__tests__/auth.test.ts',
    'src/__tests__/gemini.test.ts',
    'src/__tests__/openai.test.ts',
  ],
};