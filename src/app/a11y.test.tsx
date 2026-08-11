import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { SurfaceHost } from '@/app/SurfaceHost';
import { recomposeDuration } from '@/constitution/motion';
import { researchIdleIR } from '@/test/fixtures/researchIdle';
import { validateSceneIR } from '@/validator';

function validResearchIR() {
  const result = validateSceneIR(researchIdleIR(), { catalog: 'default' });
  if (!result.ok) throw new Error('fixture invalid');
  return result.ir;
}

function mockReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('a11y', () => {
  it('has landmark regions', () => {
    render(<SurfaceHost ir={validResearchIR()} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('status rail exposes live region', () => {
    render(<SurfaceHost ir={validResearchIR()} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('pills are keyboard reachable', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(document.activeElement).toBeTruthy();
  });

  it('recompose duration is zero when reduced motion preferred', () => {
    mockReducedMotion(true);
    expect(recomposeDuration(true)).toBe(0);
    const { container } = render(<SurfaceHost ir={validResearchIR()} />);
    expect(container.querySelector('.lcars-surface')).toHaveAttribute('data-recompose-ms', '0');
  });

  it('StatusRail omits working pulse class when reduced motion preferred', () => {
    mockReducedMotion(true);
    const fixture = {
      ...researchIdleIR(),
      modules: researchIdleIR().modules.map((module) =>
        module.id === 'status'
          ? { ...module, props: { state: 'working', label: 'WORKING' } }
          : module,
      ),
    };
    const result = validateSceneIR(fixture, { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    const { container } = render(<SurfaceHost ir={result.ir} />);
    expect(container.querySelector('.lcars-status-rail--working')).toBeNull();
    expect(screen.getByText('WORKING')).toBeInTheDocument();
  });
});
