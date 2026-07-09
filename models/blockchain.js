const crypto = require('crypto');

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * @returns {string} sha256 hex digest of this block's content and current nonce.
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .digest('hex');
  }

  /**
   * @param {number} difficulty - required number of leading zero hex chars.
   * @returns {boolean} whether this block's current hash satisfies the difficulty target.
   */
  satisfiesDifficulty(difficulty) {
    const target = Array(difficulty + 1).join('0');
    return this.hash.substring(0, difficulty) === target;
  }

  /**
   * Proof-of-work: increments the nonce and recomputes the hash until it
   * satisfies the given difficulty.
   *
   * @param {number} difficulty
   */
  mineBlock(difficulty) {
    while (!this.satisfiesDifficulty(difficulty)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  /**
   * @returns {boolean} true if every transaction in this block passes signature validation.
   */
  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Transaction {
  constructor(fromAddress, toAddress, amount, timestamp = Date.now()) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = timestamp;
    this.signature = '';
  }

  /**
   * @returns {string} sha256 hex digest of the transaction's from/to/amount/timestamp.
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  /**
   * Sets fromAddress to the signing key's public key (SPKI DER hex) and signs
   * this transaction's hash with it (sha256 digest, IEEE P1363 signature
   * encoding — the same scheme browsers produce via the Web Crypto API).
   *
   * @param {import('crypto').KeyObject} signingKey - EC private key.
   */
  signTransaction(signingKey) {
    try {
      const publicKey = crypto.createPublicKey(signingKey);
      const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
      this.fromAddress = publicKeyDer.toString('hex');

      const hashTx = this.calculateHash();
      const signature = crypto.sign('sha256', Buffer.from(hashTx), {
        key: signingKey,
        dsaEncoding: 'ieee-p1363',
      });
      this.signature = signature.toString('hex');
    } catch (error) {
      throw new Error(`Unable to sign transaction: ${error.message}`);
    }
  }

  /**
   * @returns {boolean} true for coinbase transactions (fromAddress null), or
   * if the signature verifies against fromAddress as the signer's public key.
   */
  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      return false;
    }

    try {
      const publicKey = crypto.createPublicKey({
        key: Buffer.from(this.fromAddress, 'hex'),
        format: 'der',
        type: 'spki',
      });

      return crypto.verify(
        'sha256',
        Buffer.from(this.calculateHash()),
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(this.signature, 'hex')
      );
    } catch {
      return false;
    }
  }
}

class Blockchain {
  constructor(difficulty, miningReward) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty || 2;
    this.pendingTransactions = [];
    this.miningReward = miningReward || 100;
  }

  /**
   * @returns {Block} the first block of the chain, with no transactions.
   */
  createGenesisBlock() {
    return new Block(Date.now(), [], '0');
  }

  /**
   * @returns {Block} the most recently mined block.
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Mines all pending transactions into a new block, crediting
   * miningRewardAddress with this.miningReward, then appends the block to
   * the chain and clears the mempool.
   *
   * @param {string} miningRewardAddress
   */
  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];
  }

  /**
   * Validates and queues a transaction into the mempool. Rejects
   * transactions with a missing address, an invalid/missing signature, or
   * an amount exceeding the sender's confirmed balance minus what that
   * address already has pending.
   *
   * @param {Transaction} transaction
   * @throws {Error} if the transaction is invalid for any of the above reasons.
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add transaction: missing or invalid signature');
    }

    if (transaction.amount > this.getAvailableBalance(transaction.fromAddress)) {
      throw new Error('Cannot add transaction: amount exceeds available balance');
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * @param {string} address
   * @returns {number} net balance for address across all confirmed transactions in the chain.
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) balance -= trans.amount;
        if (trans.toAddress === address) balance += trans.amount;
      }
    }

    return balance;
  }

  /**
   * @param {string} address
   * @returns {number} confirmed balance minus whatever address already has
   * queued in the mempool — the amount actually free to spend right now.
   */
  getAvailableBalance(address) {
    const alreadyPending = this.pendingTransactions
      .filter((tx) => tx.fromAddress === address)
      .reduce((sum, tx) => sum + tx.amount, 0);

    return this.getBalanceOfAddress(address) - alreadyPending;
  }

  /**
   * Walks the chain from the block after genesis, checking transaction
   * signatures, block hash integrity, the previousHash link, and that each
   * block's hash actually satisfies the configured mining difficulty.
   *
   * @returns {boolean} whether the whole chain is internally consistent.
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (!current.satisfiesDifficulty(this.difficulty)) return false;
    }

    return true;
  }

  /**
   * @returns {Transaction[]} every confirmed transaction across all blocks, in chain order.
   */
  getAllTransactions() {
    return this.chain.flatMap((block) => block.transactions);
  }
}

module.exports = { Blockchain, Block, Transaction };
