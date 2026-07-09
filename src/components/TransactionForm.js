import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';
import { signTransaction } from '../utils/wallet';

const TransactionForm = ({ wallet, onTransactionAdded }) => {
  const [formData, setFormData] = useState({ toAddress: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const fromAddress = wallet.publicKeyHex;
      const { toAddress, amount } = formData;
      const timestamp = Date.now();
      const signature = await signTransaction({ fromAddress, toAddress, amount, timestamp }, wallet.privateKey);

      await addTransaction(fromAddress, toAddress, amount, timestamp, signature);
      setMessage('Transaction added successfully!');
      setFormData({ toAddress: '', amount: '' });
      onTransactionAdded();
    } catch (err) {
      setMessage(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="transaction-form">
        <h2 className="panel-title">Create Transaction</h2>
        <p className="panel-subtitle">Generate a wallet above before creating a signed transaction.</p>
      </div>
    );
  }

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Create Transaction</h2>

      <form onSubmit={handleSubmit}>
        <p className="panel-subtitle">Transactions are signed locally with your wallet's private key.</p>

        <div className="form-group">
          <label>From Address</label>
          <div className="field-value hash">{wallet.publicKeyHex}</div>
        </div>

        <div className="form-group">
          <label htmlFor="toAddress">To Address</label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="e.g., recipient public key"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g., 100"
            step="0.01"
            min="0"
            required
          />
        </div>

        {message && (
          <div
            className={`form-message ${message.includes('success') ? 'success' : 'error'}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
