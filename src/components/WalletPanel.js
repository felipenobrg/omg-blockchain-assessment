import React, { useState, useEffect } from 'react';
import './TransactionForm.css';
import { fetchBalance } from '../api/blockchain.api';
import { generateWallet } from '../utils/wallet';

const WalletPanel = ({ wallet, onWalletCreated, chain }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!wallet) return;

    fetchBalance(wallet.publicKeyHex)
      .then((res) => setBalance(res.balance))
      .catch(() => {});
  }, [wallet, chain]);

  const handleCreateWallet = async () => {
    setLoading(true);
    setMessage('');

    try {
      const newWallet = await generateWallet();
      onWalletCreated(newWallet);
      setMessage('Wallet created successfully');
    } catch (err) {
      setMessage(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Wallet Studio</h2>
      <p className="panel-subtitle">Generate a key pair locally in the browser and inspect balance.</p>

      <button type="button" className="submit-button" onClick={handleCreateWallet} disabled={loading}>
        {loading ? 'Generating...' : 'Create Wallet'}
      </button>

      {message && (
        <div
          className={`form-message ${message.includes('success') ? 'success' : 'error'}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {wallet && (
        <div className="form-group">
          <label>Public Key (address)</label>
          <div className="field-value hash">{wallet.publicKeyHex}</div>
          <label>Balance</label>
          <div className="field-value">{balance}</div>
        </div>
      )}
    </div>
  );
};

export default WalletPanel;
