import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletPanel from './WalletPanel';
import { generateWallet } from '../utils/wallet';
import { fetchBalance } from '../api/blockchain.api';

jest.mock('../utils/wallet', () => ({
  generateWallet: jest.fn(),
}));
jest.mock('../api/blockchain.api', () => ({
  fetchBalance: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('creates a wallet and reports success', async () => {
  generateWallet.mockResolvedValue({ publicKeyHex: 'abc123', privateKey: {} });
  fetchBalance.mockResolvedValue({ balance: 0, availableBalance: 0 });
  const onWalletCreated = jest.fn();

  render(<WalletPanel wallet={null} onWalletCreated={onWalletCreated} chain={null} />);
  fireEvent.click(screen.getByRole('button', { name: /create wallet/i }));

  await waitFor(() =>
    expect(onWalletCreated).toHaveBeenCalledWith({ publicKeyHex: 'abc123', privateKey: {} })
  );
  expect(await screen.findByText(/wallet created successfully/i)).toBeInTheDocument();
});

test('shows the failure message when wallet generation throws', async () => {
  generateWallet.mockRejectedValue(new Error('Web Crypto unavailable'));

  render(<WalletPanel wallet={null} onWalletCreated={() => {}} chain={null} />);
  fireEvent.click(screen.getByRole('button', { name: /create wallet/i }));

  expect(await screen.findByText('Web Crypto unavailable')).toBeInTheDocument();
});

test('fetches and displays the available balance for an active wallet', async () => {
  fetchBalance.mockResolvedValue({ balance: 250, availableBalance: 250 });

  render(<WalletPanel wallet={{ publicKeyHex: 'abc123' }} onWalletCreated={() => {}} chain={null} />);

  expect(await screen.findByText('250')).toBeInTheDocument();
  expect(fetchBalance).toHaveBeenCalledWith('abc123');
});

test('shows how much is tied up in pending transactions when balances differ', async () => {
  fetchBalance.mockResolvedValue({ balance: 250, availableBalance: 50 });

  render(<WalletPanel wallet={{ publicKeyHex: 'abc123' }} onWalletCreated={() => {}} chain={null} />);

  expect(await screen.findByText('50')).toBeInTheDocument();
  expect(screen.getByText(/250 confirmed, 200 tied up in pending transactions/i)).toBeInTheDocument();
});
