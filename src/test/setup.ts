import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  clear: vi.fn(),
  getItem: vi.fn(),
  key: vi.fn(),
  length: 0,
  removeItem: vi.fn(),
  setItem: vi.fn()
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
