const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const requiredAddressFields = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode', 'country'];

function validateShippingAddress(address) {
  if (!address || typeof address !== 'object') return 'Shipping information is required.';
  if (requiredAddressFields.some((field) => !String(address[field] || '').trim())) return 'Complete shipping information is required.';
  if (!/^[+\d][\d\s()-]{6,28}$/.test(String(address.phone).trim())) return 'Enter a valid phone number.';
  return null;
}

function normalizedAddress(address) {
  return Object.fromEntries(requiredAddressFields.map((field) => [field, String(address[field]).trim()]));
}

function createOrderNumber() {
  return `TRD-${Date.now().toString(36).toUpperCase()}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
}

async function createOrderFromCart({ userId, shippingAddress, paymentMethod, paymentStatus, paymentReference }) {
  const addressError = validateShippingAddress(shippingAddress);
  if (addressError) {
    const error = new Error(addressError);
    error.statusCode = 400;
    throw error;
  }
  const cart = await Cart.findOne({ userId }).populate({ path: 'items.productId', select: 'name sku price images sizes sizeStock status' });
  if (!cart?.items.length) {
    const error = new Error('Your cart is empty.');
    error.statusCode = 400;
    throw error;
  }
  const items = [];
  for (const cartItem of cart.items) {
    const product = cartItem.productId;
    if (!product || product.status !== 'active') {
      const error = new Error('A cart product is no longer available.');
      error.statusCode = 400;
      throw error;
    }
    if (!cartItem.size) {
      const error = new Error(`The cart item for ${product.name} is missing its size selection. Remove it from your cart and add the product again with a selected size.`);
      error.statusCode = 400;
      throw error;
    }
    if (!product.sizes.includes(cartItem.size) || Number(product.sizeStock.get(cartItem.size)) < cartItem.quantity) {
      const error = new Error(`The selected size or stock is no longer available for ${product.name}.`);
      error.statusCode = 400;
      throw error;
    }
    items.push({ productId: product._id, productName: product.name, productSku: product.sku || '', image: product.images[0], price: product.price, quantity: cartItem.quantity, size: cartItem.size });
  }
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const order = await Order.create({
    orderNumber: createOrderNumber(), userId, items, shippingAddress: normalizedAddress(shippingAddress),
    subtotal, discount: 0, deliveryCharge: 0, totalAmount: subtotal,
    paymentMethod, paymentStatus, orderStatus: 'PLACED', paymentReference
  });
  cart.items = [];
  await cart.save();
  return order;
}

module.exports = { validateShippingAddress, createOrderFromCart };
