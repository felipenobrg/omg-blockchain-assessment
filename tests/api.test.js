process.env.SEED_DEMO_DATA = 'false';
process.env.BLOCKCHAIN_DIFFICULTY = '1';
process.env.BLOCKCHAIN_STATE_PATH = `${process.cwd()}/tests/.tmp-api-blockchain.json`;

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');
const models = require('../models');
const persistenceService = require('../services/persistence.service');
const { createSignedTransaction } = require('./helpers');

test.before(async () => {
  await persistenceService.clear();
  await models.ready;
});

test.after(async () => {
  await persistenceService.clear();
});

test('GET /api/chain starts with just the genesis block', async () => {
  const res = await request(app).get('/api/chain');

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.chain.length, 1);
});

test('GET /api/balance/:address is zero for an unknown address', async () => {
  const res = await request(app).get('/api/balance/some-unknown-address');

  assert.equal(res.status, 200);
  assert.equal(res.body.balance, 0);
});

test('POST /api/transactions rejects a malformed sender address', async () => {
  const res = await request(app)
    .post('/api/transactions')
    .send({ fromAddress: 'not-a-real-key', toAddress: 'someone', amount: 10 });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/transactions rejects a signed transaction that exceeds the sender balance', async () => {
  const signed = await createSignedTransaction({ toAddress: 'someone', amount: 999999 });

  const res = await request(app).post('/api/transactions').send(signed);

  assert.equal(res.status, 400);
  assert.match(res.body.error, /available balance/i);
});

test('POST /api/mine mines pending transactions into a new block', async () => {
  const before = await request(app).get('/api/stats');

  const res = await request(app).post('/api/mine').send({ miningRewardAddress: 'integration-test-miner' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.chainLength, before.body.chainLength + 1);
});

test('POST /api/transactions accepts a properly funded, signed transaction', async () => {
  const signed = await createSignedTransaction({ toAddress: 'someone', amount: 10 });

  await request(app).post('/api/mine').send({ miningRewardAddress: signed.fromAddress });

  const res = await request(app).post('/api/transactions').send(signed);

  assert.equal(res.status, 201);
  assert.equal(res.body.transaction.amount, 10);
});

test('GET /health reports ok status', async () => {
  const res = await request(app).get('/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('POST /api/wallets generates a key pair with a balance', async () => {
  const res = await request(app).post('/api/wallets').send({});

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.publicKey);
  assert.ok(res.body.privateKey);
  assert.equal(res.body.balance, 0);
});

test('GET /api/wallets/:address returns the balance for that address', async () => {
  const walletRes = await request(app).post('/api/wallets').send({});

  const res = await request(app).get(`/api/wallets/${encodeURIComponent(walletRes.body.publicKey)}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.address, walletRes.body.publicKey);
  assert.equal(res.body.balance, 0);
});

test('GET /api/transactions/pending lists the current mempool', async () => {
  const signed = await createSignedTransaction({ toAddress: 'someone', amount: 5 });
  await request(app).post('/api/mine').send({ miningRewardAddress: signed.fromAddress });
  await request(app).post('/api/transactions').send(signed);

  const res = await request(app).get('/api/transactions/pending');

  assert.equal(res.status, 200);
  assert.ok(res.body.pendingTransactions.some((tx) => tx.fromAddress === signed.fromAddress));

  await request(app).post('/api/mine').send({ miningRewardAddress: 'cleanup-miner' });
});

test('GET /api/transactions/all lists confirmed transactions across the chain', async () => {
  const res = await request(app).get('/api/transactions/all');

  assert.equal(res.status, 200);
  assert.ok(res.body.count > 0);
  assert.equal(res.body.transactions.length, res.body.count);
});

test('GET /api/unknown-route returns 404', async () => {
  const res = await request(app).get('/api/unknown-route');

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('GET /api/chain/valid reports the chain as valid after mining and transacting', async () => {
  const res = await request(app).get('/api/chain/valid');

  assert.equal(res.status, 200);
  assert.equal(res.body.isValid, true);
});
