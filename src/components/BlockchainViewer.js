import React from 'react';
import './BlockchainViewer.css';
import { truncateHash, formatTimestamp, formatAddress, formatAmount } from '../utils/formatters';

const BlockchainViewer = ({ blockchain }) => {
  if (!blockchain || !blockchain.chain) {
    return (
      <div className="blockchain-viewer">
        <p>Loading blockchain data...</p>
      </div>
    );
  }

  return (
    <div className="blockchain-viewer">
      <h2 className="panel-title">Blockchain ({blockchain.length} blocks)</h2>
      
      <div className="blocks-container">
        {blockchain.chain.map((block, index) => (
          <div key={block.hash} className="block-card">
            <div className="block-header">
              <span className="block-number">Block #{index}</span>
              {index === 0 && <span className="genesis-badge">Genesis</span>}
            </div>
            
            <div className="block-content">
              <div className="block-field">
                <span className="field-label">Hash:</span>
                <span className="field-value hash">{truncateHash(block.hash)}</span>
              </div>

              <div className="block-field">
                <span className="field-label">Previous Hash:</span>
                <span className="field-value hash">{truncateHash(block.previousHash) || 'N/A'}</span>
              </div>

              <div className="block-field">
                <span className="field-label">Timestamp:</span>
                <span className="field-value">
                  {formatTimestamp(block.timestamp)}
                </span>
              </div>
              
              <div className="block-field">
                <span className="field-label">Nonce:</span>
                <span className="field-value">{block.nonce}</span>
              </div>
              
              <div className="block-field">
                <span className="field-label">Transactions:</span>
                <span className="field-value">{block.transactions?.length || 0}</span>
              </div>
              
              {block.transactions && block.transactions.length > 0 && (
                <div className="transactions-list">
                  <div className="transactions-header">Transactions:</div>
                  {block.transactions.map((tx, txIndex) => (
                    <div key={`${block.hash}-${txIndex}`} className="transaction-item">
                      <div className="tx-from">
                        <span className="tx-label">From:</span>
                        <span className="tx-address">{truncateHash(formatAddress(tx.fromAddress))}</span>
                      </div>
                      <div className="tx-arrow">→</div>
                      <div className="tx-to">
                        <span className="tx-label">To:</span>
                        <span className="tx-address">{truncateHash(tx.toAddress)}</span>
                      </div>
                      <div className="tx-amount">{formatAmount(tx.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainViewer;
