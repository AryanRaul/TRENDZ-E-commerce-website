const router = require('express').Router();
const controller = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', controller.listProducts);
router.get('/search', controller.searchProducts);
router.get('/category/:gender/:category', controller.categoryProducts);
router.get('/:id', controller.getProduct);
router.post('/', protect, requireAdmin, controller.createProduct);
router.put('/:id', protect, requireAdmin, controller.updateProduct);
router.delete('/:id', protect, requireAdmin, controller.deleteProduct);
module.exports = router;
