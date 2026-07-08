const { blockchain, Transaction } = require('../models');
const persistenceService = require('../services/persistence.service');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const {
  isValidAddress,
  isValidAmount,
  isValidTimestamp,
  sanitizeAddress,
  sanitizeAmount,
  sanitizeTimestamp,
} = require('../utils/validator');

const addTransaction = async (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, timestamp, signature } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    if (signature && !isValidTimestamp(timestamp)) {
      return sendError(res, 'A signed transaction must include the timestamp that was signed', 400);
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

    blockchain.addTransaction(transaction);
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
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };
