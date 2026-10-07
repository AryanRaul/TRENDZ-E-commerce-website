const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { validateShippingAddress, createOrderFromCart } = require('../utils/orderCreation');

const PREPAID_METHODS = ['SIMULATED_CARD', 'UPI'];

function luhnValid(number) {
  let sum = 0;
  let doubled = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (doubled) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    doubled = !doubled;
  }
  return sum % 10 === 0;
}

function validExpiry(value) {
  const match = String(value || '').trim().match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})$/);
  if (!match) return false;
  const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && Number(match[1]) >= now.getMonth() + 1);
}

function paymentError(message) { const error = new Error(message); error.statusCode = 400; return error; }
function createPaymentReference() { return `SIM-${Date.now().toString(36).toUpperCase()}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`; }

const simulatePayment = asyncHandler(async (req, res) => {
  const { paymentMethod, shippingAddress, cardholderName, cardNumber, expiryDate, cvv, upiId } = req.body;
  if (!PREPAID_METHODS.includes(paymentMethod)) throw paymentError('Select a supported prepaid payment method.');
  const addressError = validateShippingAddress(shippingAddress);
  if (addressError) throw paymentError(addressError);
  let shouldFail = false;
  if (paymentMethod === 'SIMULATED_CARD') {
    const digits = String(cardNumber || '').replace(/\s|-/g, '');
    if (String(cardholderName || '').trim().length < 2) throw paymentError('Enter the cardholder name.');
    if (!/^\d{12,19}$/.test(digits) || !luhnValid(digits)) throw paymentError('Enter a valid test card number.');
    if (!validExpiry(expiryDate)) throw paymentError('Enter a valid, unexpired expiry date (MM/YY).');
    if (!/^\d{3,4}$/.test(String(cvv || ''))) throw paymentError('Enter a valid CVV.');
    shouldFail = digits.endsWith('0002');
  } else {
    const normalizedUpi = String(upiId || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,64}@[a-z][a-z0-9.-]{1,63}$/i.test(normalizedUpi)) throw paymentError('Enter a valid UPI ID, for example name@bank.');
    shouldFail = normalizedUpi.startsWith('fail@');
  }
  await new Promise((resolve) => setTimeout(resolve, 650));
  if (shouldFail) return res.json({ paymentStatus: 'FAILED', message: 'Simulated payment was declined. Your cart is still available; please retry.' });
  const paymentReference = createPaymentReference();
  const order = await createOrderFromCart({ userId: req.user._id, shippingAddress, paymentMethod, paymentStatus: 'PAID', paymentReference });
  res.status(201).json({ paymentStatus: 'SUCCESS', paymentReference, order });
});

module.exports = { simulatePayment };
