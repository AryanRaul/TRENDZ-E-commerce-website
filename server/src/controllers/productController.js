const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORY_BY_GENDER, validateProductShape } = require('../utils/productRules');

function invalidProductPayload(payload) {
  const errors = validateProductShape(payload);
  return errors.length ? errors : null;
}

const listProducts = asyncHandler(async (req, res) => {
  const { featured, gender, category } = req.query;
  // Storefront routes never reveal draft or archived products. Administrators
  // manage every status through the protected /api/admin/products endpoint.
  const filter = { status: 'active' };
  if (gender) filter.gender = gender;
  if (category) filter.category = category;
  if (featured !== undefined) filter.featured = featured === 'true';
  const products = await Product.find(filter).sort({ featured: -1, createdAt: -1 });
  res.json({ products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'active' });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product });
});

const searchProducts = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ message: 'Provide a search query using ?q=.' });
  const words = query.split(/\s+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const search = new RegExp(words.join('|'), 'i');
  const products = await Product.find({ status: 'active', $or: [{ name: search }, { description: search }, { gender: search }, { category: search }] }).sort({ featured: -1, createdAt: -1 });
  res.json({ query, products });
});

const categoryProducts = asyncHandler(async (req, res) => {
  const { gender, category } = req.params;
  if (!CATEGORY_BY_GENDER[gender]?.includes(category)) return res.status(400).json({ message: 'Invalid gender/category combination.' });
  const products = await Product.find({ gender, category, status: 'active' }).sort({ featured: -1, createdAt: -1 });
  res.json({ gender, category, products });
});

const createProduct = asyncHandler(async (req, res) => {
  const errors = invalidProductPayload(req.body);
  if (errors) return res.status(400).json({ message: 'Invalid product data.', errors });
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });
  const merged = { ...existing.toObject({ flattenMaps: true }), ...req.body, sizeStock: req.body.sizeStock || Object.fromEntries(existing.sizeStock) };
  const errors = invalidProductPayload(merged);
  if (errors) return res.status(400).json({ message: 'Invalid product data.', errors });
  Object.assign(existing, req.body);
  await existing.save();
  res.json({ product: existing });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.status(204).send();
});

module.exports = { listProducts, getProduct, searchProducts, categoryProducts, createProduct, updateProduct, deleteProduct };
