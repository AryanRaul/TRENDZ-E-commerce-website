const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Null is retained only for carts created before variants were introduced; new cart writes require a valid size.
  size: { type: String, trim: true, default: null },
  quantity: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'Quantity must be a whole number.' } }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: { type: [cartItemSchema], default: [] }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Cart', cartSchema);
