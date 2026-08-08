import { it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/app/App';

it('typed research intent recomposes to result without chat log', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText(/combadge role/i), 'physicist');
  await user.type(
    screen.getByRole('textbox', { name: 'Command' }),
    'summarize subspace theories{Enter}',
  );
  await waitFor(() => {
    expect(screen.getByRole('status').textContent).not.toBe('READY');
  });
  expect(
    await screen.findByText(/Subspace field harmonics remain stable under warp 7/i),
  ).toBeInTheDocument();
  expect(
    await screen.findByText(/Research summary for: summarize subspace theories/i),
  ).toBeInTheDocument();
  expect(screen.queryByRole('log')).not.toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
});
