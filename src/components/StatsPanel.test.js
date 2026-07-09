import { render, screen, fireEvent } from '@testing-library/react';
import StatsPanel from './StatsPanel';

const stats = {
  chainLength: 4,
  pendingTransactions: 1,
  difficulty: 2,
  miningReward: 100,
  isValid: true,
};

test('renders nothing when stats have not loaded yet', () => {
  const { container } = render(<StatsPanel stats={null} onMine={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders chain stats and calls onMine when the button is clicked', () => {
  const onMine = jest.fn();
  render(<StatsPanel stats={stats} onMine={onMine} wallet={null} />);

  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('✓ Valid')).toBeInTheDocument();
  expect(screen.getByText(/no active wallet/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /mine block/i }));
  expect(onMine).toHaveBeenCalledTimes(1);
});

test('shows a different message when a wallet is active', () => {
  render(<StatsPanel stats={stats} onMine={() => {}} wallet={{ publicKeyHex: 'abc' }} />);
  expect(screen.getByText(/reward goes to your active wallet/i)).toBeInTheDocument();
});
