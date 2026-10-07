const mongoose = require('mongoose');
const { CATEGORY_BY_GENDER, allowedSizes, validateProductShape } = require('../utils/productRules');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: 'text' },
  description: { type: String, required: true, trim: true, maxlength: 3000, index: 'text' },
  sku: { type: String, trim: true, maxlength: 80, sparse: true, unique: true },
  gender: { type: String, required: true, enum: Object.keys(CATEGORY_BY_GENDER), index: true },
  category: { type: String, required: true, lowercase: true, trim: true, index: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, max: 100 },
  images: { type: [String], required: true, validate: [(images) => images.length > 0, 'At least one image is required.'] },
  sizes: { type: [String], required: true },
  sizeStock: { type: Map, of: Number, required: true },
  featured: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true }
}, { timestamps: true, versionKey: false });

productSchema.pre('validate', function validateProduct(next) {
  const errors = validateProductShape(this);
  if (errors.length) {
    const validationError = new mongoose.Error.ValidationError(this);
    validationError.addError('product', new mongoose.Error.ValidatorError({ message: errors.join(' ') }));
    return next(validationError);
  }
  if (!CATEGORY_BY_GENDER[this.gender].includes(this.category)) return next(new Error('Invalid gender/category combination.'));
  if (this.sizes.some((size) => !allowedSizes(this.category).includes(size))) return next(new Error('Invalid size for category.'));
  next();
});

productSchema.index({ gender: 1, category: 1, status: 1 });
module.exports = mongoose.model('Product', productSchema);
