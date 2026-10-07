const router = require('express').Router();
const controller = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.put('/items/:productId', controller.updateItem);
router.delete('/items/:productId', controller.removeItem);
router.delete('/', controller.clearCart);

module.exports = router;
