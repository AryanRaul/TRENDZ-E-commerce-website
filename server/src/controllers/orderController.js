const mongoose = require('mongoose');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { createOrderFromCart } = require('../utils/orderCreation');

const createOrder = asyncHandler(async (req, res) => {
  if (req.body.paymentMethod && req.body.paymentMethod !== 'COD') return res.status(400).json({ message: 'Use the payment simulation endpoint for prepaid methods.' });
  const order = await createOrderFromCart({ userId: req.user._id, shippingAddress: req.body.shippingAddress, paymentMethod: 'COD', paymentStatus: 'PENDING' });
  res.status(201).json({ order });
});

const listOrders = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };

  const orders = await Order.find(filter)
    .populate({ path: 'userId', select: 'name email' })
    .sort({ createdAt: -1 });

  res.json({ orders });
});

const getOrder = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order id.' });
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user._id };
  const order = await Order.findOne(filter).populate({ path: 'userId', select: 'email' });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  const customerEmail = order.userId?.email;
  const orderData = order.toObject();
  orderData.userId = order.userId?._id || order.userId;
  res.json({ order: orderData, customerEmail });
});

const nextStatuses = {
  PLACED: ['PROCESSING', 'CANCELLED'],
  // CONFIRMED is retained for older orders, but advances through the same
  // customer-facing Processing stage.
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED']
};

const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order id.' });

  const orderStatus = String(req.body?.orderStatus || '').toUpperCase();
  if (!['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(orderStatus)) {
    return res.status(400).json({ message: 'Order status must be PROCESSING, SHIPPED, DELIVERED, or CANCELLED.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!nextStatuses[order.orderStatus]?.includes(orderStatus)) {
    return res.status(400).json({ message: `Cannot change an order from ${order.orderStatus} to ${orderStatus}.` });
  }

  order.orderStatus = orderStatus;
  await order.save();
  res.json({ order });
});

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
