const { blockchain } = require('../models');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/pagination');

const getChain = (req, res) => {
  const { items, total, limit, offset } = paginate(blockchain.chain, req.query);

  sendSuccess(res, {
    chain: items,
    length: total,
    limit,
    offset,
  });
};

const validateChain = (req, res) => {
  sendSuccess(res, { isValid: blockchain.isChainValid() });
};

module.exports = { getChain, validateChain };
