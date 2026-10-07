const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1;
}

function cartResponse(cart, products) {
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const items = (cart?.items || []).map((item) => {
    const productId = String(item.productId);
    const product = productById.get(productId);
    if (!product) return {
      productId, size: item.size, quantity: item.quantity,
      product: { id: productId, name: 'This product is no longer available', price: 0, images: [], sizes: [], sizeStock: {}, status: 'deleted', unavailable: true }
    };
    return {
      productId,
      size: item.size,
      quantity: item.quantity,
      product: { id: product._id, name: product.name, price: product.price, images: product.images, sizes: product.sizes, sizeStock: product.sizeStock, status: product.status }
    };
  });
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const unavailableItemError = items.some((item) => item.product.unavailable)
    ? 'A product in your cart is no longer available. Remove it before checkout.'
    : null;
  const legacyItemError = items.some((item) => !item.size)
    ? 'A cart item is missing its size selection. Remove that item and add the product again with a selected size.'
    : null;
  return { items, totalQuantity, subtotal, legacyItemError, unavailableItemError };
}

async function getPopulatedCart(userId) {
  const cart = await Cart.findOne({ userId });
  const ids = cart?.items.map((item) => item.productId) || [];
  const products = ids.length ? await Product.find({ _id: { $in: ids } }).select('name price images sizes sizeStock status') : [];
  return { cart, products };
}

function validSize(product, size, quantity) {
  return typeof size === 'string' && product.sizes.includes(size) && Number(product.sizeStock.get(size)) >= quantity;
}

function itemForVariant(cart, productId, size) {
  return cart?.items.find((item) => item.productId.equals(productId) && item.size === size);
}

function ensureProductId(productId, res) {
  if (!mongoose.isValidObjectId(productId)) {
    res.status(400).json({ message: 'Invalid product id.' });
    return false;
  }
  return true;
}

const getCart = asyncHandler(async (req, res) => {
  const { cart, products } = await getPopulatedCart(req.user._id);
  res.json({ cart: cartResponse(cart, products) });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, size, quantity = 1 } = req.body;
  if (!ensureProductId(productId, res)) return;
  if (!isValidQuantity(quantity)) return res.status(400).json({ message: 'Quantity must be a whole number of at least 1.' });
  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) return res.status(404).json({ message: 'Product not found or unavailable.' });
  if (!validSize(product, size, quantity)) return res.status(400).json({ message: 'Select an available product size with sufficient stock.' });
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = new Cart({ userId: req.user._id, items: [] });
  const existing = itemForVariant(cart, product._id, size);
  if (existing) {
    if (!validSize(product, size, existing.quantity + quantity)) return res.status(400).json({ message: 'Requested quantity exceeds available stock for this size.' });
    existing.quantity += quantity;
  } else cart.items.push({ productId: product._id, size, quantity });
  await cart.save();
  const populated = await getPopulatedCart(req.user._id);
  res.status(201).json({ cart: cartResponse(populated.cart, populated.products) });
});

const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, size } = req.body;
  if (!ensureProductId(productId, res)) return;
  if (!isValidQuantity(quantity)) return res.status(400).json({ message: 'Quantity must be a whole number of at least 1.' });
  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) return res.status(404).json({ message: 'Product not found or unavailable.' });
  if (!validSize(product, size, quantity)) return res.status(400).json({ message: 'Select an available product size with sufficient stock.' });
  const cart = await Cart.findOne({ userId: req.user._id });
  const item = itemForVariant(cart, productId, size);
  if (!item) return res.status(404).json({ message: 'Cart item not found.' });
  item.quantity = quantity;
  await cart.save();
  const populated = await getPopulatedCart(req.user._id);
  res.json({ cart: cartResponse(populated.cart, populated.products) });
});

const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const size = typeof req.query.size === 'string' && req.query.size ? req.query.size : null;
  if (!ensureProductId(productId, res)) return;
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!itemForVariant(cart, productId, size)) return res.status(404).json({ message: 'Cart item not found.' });
  cart.items = cart.items.filter((item) => !(item.productId.equals(productId) && item.size === size));
  await cart.save();
  const populated = await getPopulatedCart(req.user._id);
  res.json({ cart: cartResponse(populated.cart, populated.products) });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ cart: { items: [], totalQuantity: 0, subtotal: 0 } });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
