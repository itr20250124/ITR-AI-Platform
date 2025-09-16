import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock fetch
global.fetch = jest.fn();

// Mock File constructor
global.File = class File extends Blob {
  name: string;
  lastModified: number;

  constructor(chunks: BlobPart[], filename: string, options?: FilePropertyBag) {
    super(chunks, options);
    this.name = filename;
    this.lastModified = options?.lastModified || Date.now();
  }
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  canvas: {
    width: 1024,
    height: 1024,
    toDataURL: jest.fn(() => 'data:image/jpeg;base64,mock-canvas-data'),
  },
})) as any;

HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(['mock'], { type: 'image/jpeg' }));
});

// Mock Image constructor
global.Image = class MockImage {
  width = 1024;
  height = 1024;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  
  set src(value: string) {
    // Trigger onload after setting src
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});