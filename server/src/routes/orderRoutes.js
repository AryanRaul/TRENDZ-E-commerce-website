const router = require('express').Router();
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect);
router.post('/', createOrder);
router.get('/', listOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.get('/:id', getOrder);

module.exports = router;
