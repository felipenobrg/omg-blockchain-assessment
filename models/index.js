const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const persistenceService = require('../services/persistence.service');
const { Blockchain, Block, Transaction } = require('./blockchain');

let blockchain = new Blockchain(
  config.blockchain.difficulty,
  config.blockchain.miningReward
);

const seedDemoData = () => {
  if (!config.demoData.enabled) {
    return;
  }

  for (const { to, amount } of config.demoData.transactions) {
    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const demoTx = new Transaction('', to, amount);
    demoTx.signTransaction(privateKey);

    blockchain.minePendingTransactions(demoTx.fromAddress);
    blockchain.addTransaction(demoTx);
  }

  if (blockchain.pendingTransactions.length > 0) {
    blockchain.minePendingTransactions(config.blockchain.initialMinerAddress);
    logger.info('Seeded demo blockchain data');
  }
};

const initializeBlockchain = async () => {
  const restored = await persistenceService.load();

  if (restored) {
    blockchain = restored;
    logger.info('Loaded persisted blockchain state');
    return;
  }

  seedDemoData();
  if (blockchain.pendingTransactions.length > 0) {
    await persistenceService.save(blockchain);
  }
};

const ready = initializeBlockchain();

module.exports = {
  get blockchain() {
    return blockchain;
  },
  ready,
  Blockchain,
  Block,
  Transaction,
};
