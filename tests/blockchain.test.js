const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { Blockchain, Transaction } = require('../models/blockchain');
const persistenceService = require('../services/persistence.service');

const originalStatePath = process.env.BLOCKCHAIN_STATE_PATH;

test.beforeEach(async () => {
  process.env.BLOCKCHAIN_STATE_PATH = `${process.cwd()}/tests/.tmp-blockchain.json`;
  await persistenceService.clear();
});

test.afterEach(async () => {
  if (originalStatePath === undefined) {
    delete process.env.BLOCKCHAIN_STATE_PATH;
  } else {
    process.env.BLOCKCHAIN_STATE_PATH = originalStatePath;
  }
  await persistenceService.clear();
});

test('rejects unsigned transactions', () => {
  const chain = new Blockchain(1, 10);
  const tx = new Transaction('wallet-a', 'wallet-b', 25);

  assert.throws(() => chain.addTransaction(tx), /signature/i);
});

test('persists and restores blockchain state', async () => {
  const chain = new Blockchain(1, 100);
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
  const tx = new Transaction('wallet-a', 'wallet-b', 25);
  tx.signTransaction(privateKey);
  chain.minePendingTransactions(tx.fromAddress);
  chain.addTransaction(tx);

  await persistenceService.save(chain);
  const restored = await persistenceService.load();

  assert.ok(restored);
  assert.equal(restored.chain.length, 2);
  assert.equal(restored.pendingTransactions.length, 1);
  assert.equal(restored.pendingTransactions[0].amount, 25);
});

test('rejects transactions that exceed available balance', () => {
  const chain = new Blockchain(1, 100);
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const tx = new Transaction('', 'recipient', 500);
  tx.signTransaction(privateKey);

  assert.throws(() => chain.addTransaction(tx), /available balance/i);
});

test('detects a block whose hash does not satisfy the configured difficulty', () => {
  const chain = new Blockchain(2, 100);
  chain.minePendingTransactions('miner-address');
  assert.equal(chain.isChainValid(), true);

  const forged = chain.chain[1];
  forged.nonce = 0;
  forged.hash = forged.calculateHash();
  while (forged.satisfiesDifficulty(chain.difficulty)) {
    forged.nonce++;
    forged.hash = forged.calculateHash();
  }

  assert.equal(chain.isChainValid(), false);
});

test('detects a broken link between blocks', () => {
  const chain = new Blockchain(1, 100);
  chain.minePendingTransactions('miner-address');
  chain.minePendingTransactions('miner-address');
  assert.equal(chain.isChainValid(), true);

  chain.chain[2].previousHash = 'tampered-hash';

  assert.equal(chain.isChainValid(), false);
});

test('accepts a transaction signed the same way the browser wallet signs it', async () => {
  const subtle = crypto.webcrypto.subtle;
  const chain = new Blockchain(1, 100);

  const keyPair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const spki = await subtle.exportKey('spki', keyPair.publicKey);
  const fromAddress = Buffer.from(spki).toString('hex');
  const toAddress = 'recipient';
  const amount = 10;
  const timestamp = Date.now();

  const hashHex = crypto.createHash('sha256').update(fromAddress + toAddress + amount + timestamp).digest('hex');
  const signatureBuffer = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    Buffer.from(hashHex, 'utf8')
  );

  const tx = new Transaction(fromAddress, toAddress, amount, timestamp);
  tx.signature = Buffer.from(signatureBuffer).toString('hex');

  chain.minePendingTransactions(fromAddress);

  assert.doesNotThrow(() => chain.addTransaction(tx));
});

test('rejects a transaction whose timestamp was changed after signing', () => {
  const chain = new Blockchain(1, 100);
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const tx = new Transaction('', 'recipient', 10);
  tx.signTransaction(privateKey);

  chain.minePendingTransactions(tx.fromAddress);
  tx.timestamp += 1;

  assert.throws(() => chain.addTransaction(tx), /signature/i);
});
