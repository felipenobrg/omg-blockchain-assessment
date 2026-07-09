import React, { useState } from 'react';
import './BlockchainViewer.css';
import { fetchPendingTransactions } from '../api/blockchain.api';
import usePolling from '../hooks/usePolling';
import { POLL_INTERVAL_MS } from '../constants';
import { truncateHash, formatAddress } from '../utils/formatters';

const PendingTransactions = () => {
  const [pending, setPending] = useState([]);

  usePolling(async () => {
    try {
      const res = await fetchPendingTransactions();
      setPending(res.pendingTransactions);
    } catch {}
  }, POLL_INTERVAL_MS);

  return (
    <div className="blockchain-viewer">
      <h2 className="panel-title">Pending Transactions ({pending.length})</h2>

      {pending.length === 0 ? (
        <p className="panel-subtitle">No transactions waiting to be mined.</p>
      ) : (
        <div className="transactions-list">
          {pending.map((tx, index) => (
            <div key={`${tx.signature || 'reward'}-${index}`} className="transaction-item">
              <div className="tx-from">
                <span className="tx-label">From:</span>
                <span className="tx-address">{truncateHash(formatAddress(tx.fromAddress))}</span>
              </div>
              <div className="tx-arrow">→</div>
              <div className="tx-to">
                <span className="tx-label">To:</span>
                <span className="tx-address">{truncateHash(tx.toAddress)}</span>
              </div>
              <div className="tx-amount">{tx.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingTransactions;
