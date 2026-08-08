import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SurfaceHost } from '@/app/SurfaceHost';
import { SceneIRSchema } from '@/ir/schema';
import { researchIdleIR } from '@/test/fixtures/researchIdle';
import { validateSceneIR } from '@/validator';

afterEach(() => {
  cleanup();
});

describe('catalog renderers', () => {
  it('renders status READY from IR', () => {
    const result = validateSceneIR(researchIdleIR(), { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    render(<SurfaceHost ir={result.ir} />);
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAccessibleName(/research/i);
  });

  it('throws when IR is not validated', () => {
    const ir = SceneIRSchema.parse(researchIdleIR());
    expect(() => render(<SurfaceHost ir={ir} />)).toThrow(/validated/i);
  });

  it('QueryAperture exposes Command label', () => {
    const result = validateSceneIR(researchIdleIR(), { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    render(<SurfaceHost ir={result.ir} />);
    expect(screen.getByLabelText('Command')).toBeInTheDocument();
  });

  it('QueryAperture submits intent through handlers', async () => {
    const onIntent = vi.fn();
    const result = validateSceneIR(researchIdleIR(), { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    const user = userEvent.setup();
    render(<SurfaceHost ir={result.ir} handlers={{ onIntent }} />);
    await user.type(screen.getByLabelText('Command'), 'summarize theories');
    await user.keyboard('{Enter}');
    expect(onIntent).toHaveBeenCalledWith('summarize theories');
  });

  it('StatusRail applies working pulse class', () => {
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
    expect(container.querySelector('.lcars-status-rail--working')).toBeTruthy();
  });

  it('ActionPill meets minimum touch target', () => {
    const fixture = {
      ...researchIdleIR(),
      modules: [
        ...researchIdleIR().modules,
        {
          id: 'go',
          type: 'actionPill',
          regionId: 'main',
          props: { label: 'GO' },
          tokens: { fill: 'action.amber', ink: 'ink.onFill' },
        },
      ],
    };
    const result = validateSceneIR(fixture, { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    render(<SurfaceHost ir={result.ir} />);
    const button = screen.getByRole('button', { name: 'GO' });
    expect(button).toHaveClass('lcars-action-pill');
  });

  it('does not render chat transcript log landmark', () => {
    const fixture = {
      ...researchIdleIR(),
      dialogue: { turns: [{ role: 'user' as const, text: 'why diverge' }] },
      modules: [
        ...researchIdleIR().modules,
        {
          id: 'dialogue',
          type: 'dialogue',
          regionId: 'main',
          props: {},
          tokens: { fill: 'frame.amber', ink: 'ink.onFill' },
        },
      ],
    };
    const result = validateSceneIR(fixture, { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    render(<SurfaceHost ir={result.ir} />);
    expect(screen.getByText('why diverge')).toBeInTheDocument();
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });

  it('maps region kinds to landmarks', () => {
    const result = validateSceneIR(researchIdleIR(), { catalog: 'default' });
    if (!result.ok) throw new Error('fixture invalid');
    render(<SurfaceHost ir={result.ir} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
