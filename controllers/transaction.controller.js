const { blockchain, Transaction } = require('../models');
const persistenceService = require('../services/persistence.service');
const { sendSuccess, sendCreated } = require('../utils/response');
const HttpError = require('../utils/httpError');
const { paginate } = require('../utils/pagination');
const {
  isValidAddress,
  isValidSenderAddress,
  isValidAmount,
  isValidTimestamp,
  sanitizeAddress,
  sanitizeAmount,
  sanitizeTimestamp,
} = require('../utils/validator');

const addTransaction = async (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, timestamp, signature } = req.body;

    if (!isValidSenderAddress(fromAddress)) {
      throw new HttpError(400, 'From address must be a valid public key');
    }

    if (!isValidAddress(toAddress)) {
      throw new HttpError(400, 'Invalid recipient address');
    }

    if (!isValidAmount(amount)) {
      throw new HttpError(400, 'Amount must be a positive number');
    }

    if (signature && !isValidTimestamp(timestamp)) {
      throw new HttpError(400, 'A signed transaction must include the timestamp that was signed');
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount),
      isValidTimestamp(timestamp) ? sanitizeTimestamp(timestamp) : undefined
    );

    if (signature) {
      transaction.signature = signature;
    }

    try {
      blockchain.addTransaction(transaction);
    } catch (err) {
      throw new HttpError(400, err.message);
    }

    await persistenceService.save(blockchain);

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const { items, total, limit, offset } = paginate(blockchain.getAllTransactions(), req.query);
  sendSuccess(res, { transactions: items, count: total, limit, offset });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };
