const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { simulatePayment } = require('../controllers/paymentController');

router.post('/simulate', protect, simulatePayment);

module.exports = router;
