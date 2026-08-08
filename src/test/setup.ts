import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@react-three/fiber', () => ({
  Canvas: ({
    children,
    frameloop,
    className,
  }: {
    children?: React.ReactNode;
    frameloop?: string;
    className?: string;
  }) =>
    createElement(
      'div',
      { 'data-testid': 'r3f-canvas', 'data-frameloop': frameloop, className },
      children,
    ),
  useFrame: () => undefined,
  useThree: () => ({ invalidate: () => undefined }),
}));
