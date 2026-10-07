const router = require('express').Router();
const controller = require('../controllers/adminProductController');
const { protect, requireAdmin } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

router.use(protect, requireAdmin);
router.get('/products', controller.listAdminProducts);
router.post('/uploads/products', uploadProductImage.single('image'), controller.uploadAdminProductImage);
router.post('/products', controller.createAdminProduct);
router.put('/products/:id', controller.updateAdminProduct);
router.delete('/products/:id', controller.deactivateAdminProduct);

module.exports = router;
