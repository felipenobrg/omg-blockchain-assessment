const crypto = require('crypto');

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

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

  satisfiesDifficulty(difficulty) {
    const target = Array(difficulty + 1).join('0');
    return this.hash.substring(0, difficulty) === target;
  }

  mineBlock(difficulty) {
    while (!this.satisfiesDifficulty(difficulty)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

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

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

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

  createGenesisBlock() {
    return new Block(Date.now(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

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

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add transaction: missing or invalid signature');
    }

    const alreadyPending = this.pendingTransactions
      .filter((tx) => tx.fromAddress === transaction.fromAddress)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const availableBalance = this.getBalanceOfAddress(transaction.fromAddress) - alreadyPending;

    if (transaction.amount > availableBalance) {
      throw new Error('Cannot add transaction: amount exceeds available balance');
    }

    this.pendingTransactions.push(transaction);
  }

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

  getAllTransactions() {
    return this.chain.flatMap((block) => block.transactions);
  }
}

module.exports = { Blockchain, Block, Transaction };
