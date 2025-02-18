import '@testing-library/jest-dom';

// Mock WebSocket
type MockFunction = ReturnType<typeof jest.fn>;
interface MockWebSocketStatic extends MockFunction {
  CLOSED: number;
  CLOSING: number;
  CONNECTING: number;
  OPEN: number;
}

const MockWebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as MockWebSocketStatic;

MockWebSocket.CLOSED = 3;
MockWebSocket.CLOSING = 2;
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 0);
  return 0;
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn();

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
})); 