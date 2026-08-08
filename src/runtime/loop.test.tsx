import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/app/App';

it('typed research intent recomposes to result without chat log', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText(/combadge role/i), 'physicist');
  await user.type(screen.getByLabelText(/command/i), 'summarize subspace theories{Enter}');
  expect(await screen.findByText(/WORKING|READY|RESULT/i)).toBeTruthy();
  expect(screen.queryByRole('log')).not.toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
});
