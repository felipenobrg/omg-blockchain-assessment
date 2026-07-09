import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionForm from './TransactionForm';
import { signTransaction } from '../utils/wallet';
import { addTransaction } from '../api/blockchain.api';

jest.mock('../utils/wallet', () => ({
  signTransaction: jest.fn(),
}));
jest.mock('../api/blockchain.api', () => ({
  addTransaction: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('prompts to create a wallet first when none is active', () => {
  render(<TransactionForm wallet={null} onTransactionAdded={() => {}} />);
  expect(screen.getByText(/generate a wallet above/i)).toBeInTheDocument();
});

test('signs and submits a transaction using the active wallet', async () => {
  const wallet = { publicKeyHex: 'sender-key', privateKey: {} };
  signTransaction.mockResolvedValue('deadbeef');
  addTransaction.mockResolvedValue({ success: true });
  const onTransactionAdded = jest.fn();

  render(<TransactionForm wallet={wallet} onTransactionAdded={onTransactionAdded} />);

  fireEvent.change(screen.getByLabelText(/to address/i), { target: { value: 'recipient-key' } });
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

  await waitFor(() => expect(addTransaction).toHaveBeenCalled());

  const [fromAddress, toAddress, amount, , signature] = addTransaction.mock.calls[0];
  expect(fromAddress).toBe('sender-key');
  expect(toAddress).toBe('recipient-key');
  expect(amount).toBe('10');
  expect(signature).toBe('deadbeef');
  expect(onTransactionAdded).toHaveBeenCalledTimes(1);
  expect(await screen.findByText(/transaction added successfully/i)).toBeInTheDocument();
});

test('shows the server error message when the transaction is rejected', async () => {
  const wallet = { publicKeyHex: 'sender-key', privateKey: {} };
  signTransaction.mockResolvedValue('deadbeef');
  addTransaction.mockRejectedValue(new Error('Cannot add transaction: amount exceeds available balance'));

  render(<TransactionForm wallet={wallet} onTransactionAdded={() => {}} />);

  fireEvent.change(screen.getByLabelText(/to address/i), { target: { value: 'recipient-key' } });
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '999999' } });
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

  expect(await screen.findByText(/amount exceeds available balance/i)).toBeInTheDocument();
});
