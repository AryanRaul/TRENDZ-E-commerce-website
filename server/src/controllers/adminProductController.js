const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORY_BY_GENDER, allowedSizes, validateProductShape } = require('../utils/productRules');

const permittedFields = ['name', 'description', 'sku', 'price', 'originalPrice', 'discount', 'category', 'gender', 'images', 'sizes', 'sizeStock', 'status', 'featured'];

function cleanProductPayload(payload, existing = {}) {
  const picked = Object.fromEntries(permittedFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field)).map((field) => [field, payload[field]]));
  const product = { ...existing, ...picked };
  product.name = typeof product.name === 'string' ? product.name.trim() : product.name;
  product.description = typeof product.description === 'string' ? product.description.trim() : product.description;
  product.sku = typeof product.sku === 'string' && product.sku.trim() ? product.sku.trim().toUpperCase() : undefined;
  product.gender = typeof product.gender === 'string' ? product.gender.trim().toLowerCase() : product.gender;
  product.category = typeof product.category === 'string' ? product.category.trim().toLowerCase() : product.category;
  product.images = Array.isArray(product.images) ? product.images.map((image) => String(image).trim()).filter(Boolean) : product.images;
  product.sizes = Array.isArray(product.sizes) ? [...new Set(product.sizes.map(String))] : product.sizes;
  product.sizeStock = product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock;
  product.price = Number(product.price);
  // The admin form intentionally has one selling-price field. Preserve an
  // existing higher original price for a sale, otherwise keep both values in
  // sync so the model's legacy pricing fields remain valid.
  product.originalPrice = !Object.prototype.hasOwnProperty.call(payload, 'originalPrice')
    ? Math.max(Number(existing.originalPrice) || 0, product.price)
    : Number(product.originalPrice);
  product.discount = !Object.prototype.hasOwnProperty.call(payload, 'discount')
    ? Math.max(0, Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100))
    : Number(product.discount);
  return product;
}

function validateAdminProduct(product) {
  const errors = validateProductShape(product);
  if (!product.name || product.name.length > 160) errors.push('Name is required and must be 160 characters or fewer.');
  if (!product.description || product.description.length > 3000) errors.push('Description is required and must be 3000 characters or fewer.');
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push('Price must be a valid number greater than 0.');
  if (!Number.isFinite(product.originalPrice) || product.originalPrice < product.price) errors.push('Original price must be a valid value greater than or equal to price.');
  if (!Number.isFinite(product.discount) || product.discount < 0 || product.discount > 100) errors.push('Discount must be between 0 and 100.');
  if (!Array.isArray(product.images) || !product.images.length || product.images.some((image) => !image || image.length > 2048)) errors.push('At least one valid image path is required.');
  if (!CATEGORY_BY_GENDER[product.gender]?.includes(product.category)) errors.push('Choose a valid gender and category combination.');
  if (!Array.isArray(product.sizes) || product.sizes.some((size) => !allowedSizes(product.category).includes(size))) errors.push('Choose valid sizes for the selected category.');
  if (!['active', 'draft'].includes(product.status || 'active')) errors.push('Status must be active or draft.');
  return [...new Set(errors)];
}

function productData(product) {
  return { ...product, status: product.status || 'active', featured: Boolean(product.featured) };
}

const listAdminProducts = asyncHandler(async (req, res) => {
  // Archived records from previous versions remain hidden and are never restorable.
  const products = await Product.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 });
  res.json({ products });
});

const createAdminProduct = asyncHandler(async (req, res) => {
  const product = cleanProductPayload(req.body);
  const errors = validateAdminProduct(product);
  if (errors.length) return res.status(400).json({ message: 'Invalid product data.', errors });
  const created = await Product.create(productData(product));
  res.status(201).json({ product: created });
});

const updateAdminProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });
  const product = cleanProductPayload(req.body, existing.toObject({ flattenMaps: true }));
  const errors = validateAdminProduct(product);
  if (errors.length) return res.status(400).json({ message: 'Invalid product data.', errors });
  Object.assign(existing, productData(product));
  await existing.save();
  res.json({ product: existing });
});

const deactivateAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.status(204).send();
});

const uploadAdminProductImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Select an image to upload.' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ image: `${baseUrl}/uploads/${req.file.filename}` });
});

module.exports = { listAdminProducts, createAdminProduct, updateAdminProduct, deactivateAdminProduct, uploadAdminProductImage };
