const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  isNonEmptyString,
  isValidAddress,
  isValidSenderAddress,
  isValidAmount,
  isValidTimestamp,
  sanitizeAddress,
  sanitizeAmount,
  sanitizeTimestamp,
} = require('../utils/validator');

const { publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const validSenderAddress = publicKey.export({ type: 'spki', format: 'der' }).toString('hex');

test('isNonEmptyString', () => {
  assert.equal(isNonEmptyString('hello'), true);
  assert.equal(isNonEmptyString(''), false);
  assert.equal(isNonEmptyString('   '), false);
  assert.equal(isNonEmptyString(null), false);
  assert.equal(isNonEmptyString(undefined), false);
  assert.equal(isNonEmptyString(123), false);
});

test('isValidAddress accepts any non-empty label', () => {
  assert.equal(isValidAddress('miner1'), true);
  assert.equal(isValidAddress(validSenderAddress), true);
  assert.equal(isValidAddress(''), false);
  assert.equal(isValidAddress(null), false);
});

test('isValidSenderAddress requires P-256 SPKI hex of the exact length', () => {
  assert.equal(isValidSenderAddress(validSenderAddress), true);
  assert.equal(isValidSenderAddress(validSenderAddress.toUpperCase()), true);
  assert.equal(isValidSenderAddress('miner1'), false);
  assert.equal(isValidSenderAddress(validSenderAddress.slice(0, -2)), false);
  assert.equal(isValidSenderAddress(`${validSenderAddress.slice(0, -2)}zz`), false);
  assert.equal(isValidSenderAddress(''), false);
  assert.equal(isValidSenderAddress(null), false);
});

test('isValidAmount', () => {
  assert.equal(isValidAmount(10), true);
  assert.equal(isValidAmount('10.5'), true);
  assert.equal(isValidAmount(0), false);
  assert.equal(isValidAmount(-5), false);
  assert.equal(isValidAmount('abc'), false);
  assert.equal(isValidAmount(Infinity), false);
  assert.equal(isValidAmount(NaN), false);
});

test('isValidTimestamp', () => {
  assert.equal(isValidTimestamp(Date.now()), true);
  assert.equal(isValidTimestamp(0), false);
  assert.equal(isValidTimestamp(-1), false);
  assert.equal(isValidTimestamp('not-a-number'), false);
  assert.equal(isValidTimestamp(NaN), false);
  assert.equal(isValidTimestamp(undefined), false);
});

test('sanitizeAddress trims whitespace and coerces to string', () => {
  assert.equal(sanitizeAddress('  miner1  '), 'miner1');
  assert.equal(sanitizeAddress(123), '123');
});

test('sanitizeAmount parses to a float', () => {
  assert.equal(sanitizeAmount('10.5'), 10.5);
  assert.equal(sanitizeAmount(10), 10);
});

test('sanitizeTimestamp parses to a number', () => {
  assert.equal(sanitizeTimestamp('12345'), 12345);
  assert.equal(sanitizeTimestamp(12345), 12345);
});
