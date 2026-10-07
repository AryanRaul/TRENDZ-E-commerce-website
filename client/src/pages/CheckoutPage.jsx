import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const initialAddress = { fullName: '', phone: '', address: '', city: '', state: '', postalCode: '', country: '' };
const initialPayment = { cardholderName: '', cardNumber: '', expiryDate: '', cvv: '', upiId: '' };

export default function CheckoutPage() {
  const [shippingAddress, setShippingAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState('SIMULATED_CARD');
  const [payment, setPayment] = useState(initialPayment);
  const [error, setError] = useState('');
  const [paymentFailure, setPaymentFailure] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  function updateAddress(event) { setShippingAddress((address) => ({ ...address, [event.target.name]: event.target.value })); }
  function updatePayment(event) { setPayment((details) => ({ ...details, [event.target.name]: event.target.value })); }
  function chooseMethod(event) { setPaymentMethod(event.target.value); setError(''); setPaymentFailure(''); }

  async function placeOrder(event) {
    event.preventDefault(); setError(''); setPaymentFailure('');
    if (Object.values(shippingAddress).some((value) => !value.trim())) return setError('Complete all shipping fields.');
    setIsSubmitting(true);
    try {
      if (paymentMethod === 'COD') {
        const data = await apiRequest('/api/orders', { method: 'POST', headers: authHeaders, body: JSON.stringify({ shippingAddress, paymentMethod: 'COD' }) });
        await refreshCart();
        navigate(`/receipt/${data.order._id}`, { replace: true });
        return;
      }
      // A short UI delay makes the simulated gateway state visible; the server also simulates processing.
      await new Promise((resolve) => setTimeout(resolve, 450));
      const data = await apiRequest('/api/payments/simulate', { method: 'POST', headers: authHeaders, body: JSON.stringify({ shippingAddress, paymentMethod, ...payment }) });
      if (data.paymentStatus === 'FAILED') { setPaymentFailure(data.message); return; }
      await refreshCart();
      navigate(`/receipt/${data.order._id}`, { replace: true });
    } catch (requestError) { setError(requestError.message); } finally { setIsSubmitting(false); }
  }

  if (!cart.items.length) return <main className="checkout-page"><section className="empty-cart"><p className="eyebrow">CHECKOUT</p><h1>Your cart is empty.</h1><Link className="form-submit cart-login" to="/">Browse products</Link></section></main>;
  if (cart.legacyItemError) return <main className="checkout-page"><section className="empty-cart"><p className="eyebrow">CHECKOUT</p><h1>Choose a size before checkout.</h1><p>{cart.legacyItemError}</p><Link className="form-submit cart-login" to="/cart">Back to cart</Link></section></main>;
  if (cart.unavailableItemError) return <main className="checkout-page"><section className="empty-cart"><p className="eyebrow">CHECKOUT</p><h1>A cart item is unavailable.</h1><p>{cart.unavailableItemError}</p><Link className="form-submit cart-login" to="/cart">Review cart</Link></section></main>;
  return <main className="checkout-page"><p className="eyebrow">SECURE CHECKOUT</p><h1>Complete your order</h1><p className="checkout-note">Card and UPI are clearly labelled simulations: no financial transaction is made and payment details are never saved.</p><div className="checkout-layout"><form className="shipping-form" onSubmit={placeOrder} noValidate><section><div className="checkout-step"><span>01</span><h2>Shipping information</h2></div><div className="address-fields">{Object.entries({ fullName: 'Full name', phone: 'Phone number', address: 'Address', city: 'City', state: 'State', postalCode: 'Postal / ZIP code', country: 'Country' }).map(([field, label]) => <label key={field}>{label}<input name={field} value={shippingAddress[field]} onChange={updateAddress} autoComplete={field === 'fullName' ? 'name' : field} required /></label>)}</div></section><section className="payment-section"><div className="checkout-step"><span>02</span><h2>Payment method</h2></div><div className="payment-options">{[['SIMULATED_CARD', 'Simulated Card'], ['UPI', 'Simulated UPI'], ['COD', 'Cash on Delivery']].map(([value, label]) => <label className="payment-option" key={value}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={chooseMethod} /><span>{label}<small>{value === 'COD' ? 'Pay on delivery' : 'No real payment is taken'}</small></span></label>)}</div>{paymentMethod === 'SIMULATED_CARD' && <div className="payment-details"><p>Use test card <strong>4242 4242 4242 4242</strong> for success. A valid card ending <strong>0002</strong> simulates a decline.</p><label>Cardholder name<input name="cardholderName" value={payment.cardholderName} onChange={updatePayment} autoComplete="cc-name" /></label><label>Card number<input name="cardNumber" value={payment.cardNumber} onChange={updatePayment} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" /></label><div className="payment-field-row"><label>Expiry date<input name="expiryDate" value={payment.expiryDate} onChange={updatePayment} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" /></label><label>CVV<input name="cvv" value={payment.cvv} onChange={updatePayment} inputMode="numeric" autoComplete="cc-csc" type="password" maxLength="4" /></label></div></div>}{paymentMethod === 'UPI' && <div className="payment-details"><p>Enter a UPI ID such as <strong>name@bank</strong>. Use <strong>fail@upi</strong> to reliably simulate a failed payment.</p><label>UPI ID<input name="upiId" value={payment.upiId} onChange={updatePayment} autoComplete="off" placeholder="name@bank" /></label></div>}{paymentMethod === 'COD' && <p className="payment-details">Pay when your order is delivered. No payment credentials are required.</p>}</section><section className="review-section"><div className="checkout-step"><span>03</span><h2>Review order</h2></div><p>Your final total is calculated from the current cart and product prices on the server.</p></section>{paymentFailure && <p className="payment-failure" role="alert">{paymentFailure} Retry after checking your payment details.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="form-submit checkout-submit" disabled={isSubmitting} type="submit">{isSubmitting ? (paymentMethod === 'COD' ? 'Placing order…' : 'Processing payment…') : paymentFailure ? 'Retry simulated payment' : paymentMethod === 'COD' ? 'Place COD order' : `Pay ${price(cart.subtotal)} (simulated)`}</button></form><OrderReview cart={cart} /></div></main>;
}

export function OrderReview({ cart }) { return <aside className="cart-summary checkout-summary"><h2>Order summary</h2>{cart.items.map((item) => <p key={`${item.productId}-${item.size}`}><span>{item.product.name} · {item.size} × {item.quantity}</span><span>{price(item.product.price * item.quantity)}</span></p>)}<p className="cart-total"><span>Final total</span><strong>{price(cart.subtotal)}</strong></p><small>Delivery and discounts are currently ₹0. Your final amount is recalculated securely by the server.</small></aside>; }
