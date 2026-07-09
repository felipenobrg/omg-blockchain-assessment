const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/response');
const HttpError = require('../utils/httpError');
const { isValidAddress, sanitizeAddress } = require('../utils/validator');
const { blockchain } = require('../models');

const generateWallet = (req, res, next) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });

    const publicKeyHex = publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

    sendSuccess(res, {
      publicKey: publicKeyHex,
      privateKey: privateKeyPem,
      balance: blockchain.getBalanceOfAddress(publicKeyHex),
      availableBalance: blockchain.getAvailableBalance(publicKeyHex),
    });
  } catch (error) {
    next(new HttpError(500, error.message || 'Failed to create wallet'));
  }
};

const getWalletBalance = (req, res) => {
  const address = sanitizeAddress(req.params.address);

  if (!isValidAddress(address)) {
    return sendError(res, 'Invalid wallet address', 400);
  }

  sendSuccess(res, {
    address,
    balance: blockchain.getBalanceOfAddress(address),
    availableBalance: blockchain.getAvailableBalance(address),
  });
};

module.exports = { generateWallet, getWalletBalance };
