import { render, screen } from '@testing-library/react';
import BlockchainViewer from './BlockchainViewer';

const longHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';

const buildBlockchain = () => ({
  length: 2,
  chain: [
    {
      hash: longHash,
      previousHash: '0',
      timestamp: Date.now(),
      nonce: 0,
      transactions: [],
    },
    {
      hash: `${longHash}2`,
      previousHash: longHash,
      timestamp: Date.now(),
      nonce: 42,
      transactions: [
        { fromAddress: null, toAddress: 'miner1', amount: 100 },
        { fromAddress: 'sender-address-1234567890', toAddress: 'recipient', amount: 5 },
      ],
    },
  ],
});

test('shows a loading state when there is no blockchain data yet', () => {
  render(<BlockchainViewer blockchain={null} />);
  expect(screen.getByText(/loading blockchain data/i)).toBeInTheDocument();
});

test('renders the reported block count and one card per block, with a genesis badge', () => {
  render(<BlockchainViewer blockchain={buildBlockchain()} />);

  expect(screen.getByText('Blockchain (2 blocks)')).toBeInTheDocument();
  expect(screen.getByText('Block #0')).toBeInTheDocument();
  expect(screen.getByText('Block #1')).toBeInTheDocument();
  expect(screen.getByText('Genesis')).toBeInTheDocument();
});

test('shows "Mining Reward" for coinbase transactions and truncates long addresses', () => {
  render(<BlockchainViewer blockchain={buildBlockchain()} />);

  expect(screen.getByText('Mining Reward')).toBeInTheDocument();
  expect(screen.queryByText('sender-address-1234567890')).not.toBeInTheDocument();
  expect(screen.queryByText(longHash)).not.toBeInTheDocument();
});
