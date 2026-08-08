import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { vi } from 'vitest';

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
