import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const timeline = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function timelineIndex(status) {
  if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'PROCESSING') return 1;
  if (status === 'SHIPPED') return 2;
  if (status === 'DELIVERED') return 3;
  return 0;
}

export default function OrderDetailsPage() {
  const { id } = useParams(); const { token } = useAuth(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
  useEffect(() => { apiRequest(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((data) => setOrder(data.order)).catch((requestError) => setError(requestError.message)); }, [id, token]);
  if (error) return <main className="orders-page"><p className="form-error">{error}</p><Link to="/orders">Back to orders</Link></main>;
  if (!order) return <main className="orders-page"><p>Loading order…</p></main>;
  const address = order.shippingAddress; const activeStep = timelineIndex(order.orderStatus); const customerOrderStatus = ['ACCEPTED', 'CONFIRMED'].includes(order.orderStatus) ? 'PROCESSING' : order.orderStatus;
  return <main className="orders-page"><Link className="back-link" to="/orders">← Back to orders</Link><p className="eyebrow">ORDER DETAILS</p><h1>{order.orderNumber}</h1><p className="page-intro">Placed {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p><section className="order-timeline" aria-label={`Order status: ${customerOrderStatus}`}>{timeline.map((step, index) => { const complete = index < activeStep || (activeStep === timeline.length - 1 && index === activeStep); const current = index === activeStep && !complete; return <div className={`timeline-step${complete ? ' timeline-complete' : ''}${current ? ' timeline-current' : ''}`} key={step}><span>{complete ? '✓' : current ? '●' : index + 1}</span><strong>{step[0] + step.slice(1).toLowerCase()}</strong></div>; })}</section>{order.orderStatus === 'CANCELLED' && <p className="form-error">This order has been cancelled.</p>}<div className="order-detail-grid"><section className="order-detail-card"><h2>Items in your order</h2>{order.items.map((item) => <div className="order-line" key={`${item.productId}-${item.size}`}><span><strong>{item.productName}</strong><small>Size {item.size} · Quantity {item.quantity} · {price(item.price)} each</small></span><strong>{price(item.price * item.quantity)}</strong></div>)}<p><span>Subtotal</span><strong>{price(order.subtotal)}</strong></p><p className="cart-total"><span>Total amount</span><strong>{price(order.totalAmount)}</strong></p></section><section className="order-detail-card"><h2>Payment & delivery</h2><dl className="order-meta"><div><dt>Payment method</dt><dd>{order.paymentMethod || 'COD'}</dd></div><div><dt>Payment status</dt><dd><span className={`status-badge payment-${String(order.paymentStatus).toLowerCase()}`}>{order.paymentStatus}</span></dd></div>{order.paymentReference && <div><dt>Payment reference</dt><dd>{order.paymentReference}</dd></div>}<div><dt>Order status</dt><dd><span className={`status-badge order-${String(customerOrderStatus).toLowerCase()}`}>{customerOrderStatus}</span></dd></div></dl><h2>Shipping address</h2><p className="address-block">{address.fullName}<br />{address.phone}<br />{address.address}<br />{address.city}, {address.state} {address.postalCode}<br />{address.country}</p></section></div></main>;
}
