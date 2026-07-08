const { Router } = require('express');
const { generateWallet, getWalletBalance } = require('../controllers/wallet.controller');
const { writeLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

router.post('/', writeLimiter, generateWallet);
router.get('/:address', getWalletBalance);

module.exports = router;
