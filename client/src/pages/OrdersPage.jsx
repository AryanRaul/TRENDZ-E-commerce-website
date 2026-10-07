import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const customerStatus = (status) => ['ACCEPTED', 'CONFIRMED'].includes(status) ? 'PROCESSING' : status;

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { apiRequest('/api/orders', { headers: { Authorization: `Bearer ${token}` } }).then((data) => setOrders(data.orders)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)); }, [token]);
  if (loading) return <main className="orders-page"><p>Loading orders…</p></main>;
  return <main className="orders-page"><p className="eyebrow">MY ORDERS</p><h1>Order history</h1><p className="page-intro">Track your purchases and view full delivery details.</p>{error && <p className="form-error">{error}</p>}{!orders.length ? <section className="empty-cart"><p>You have not placed an order yet.</p><Link className="form-submit cart-login" to="/">Browse products</Link></section> : <div className="orders-list">{orders.map((order) => { const status = customerStatus(order.orderStatus); return <article className="order-card" key={order._id}><span className="order-reference"><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</small></span><span className="order-payment"><small>{order.paymentMethod || 'COD'}</small><span className={`status-badge payment-${String(order.paymentStatus).toLowerCase()}`}>Payment · {order.paymentStatus}</span></span><span><small>Order status</small><span className={`status-badge order-${String(status).toLowerCase()}`}>{status}</span></span><strong className="order-total">{price(order.totalAmount)}</strong><span className="order-actions"><Link to={`/orders/${order._id}`}>View order</Link><Link to={`/receipt/${order._id}`}>View receipt</Link></span></article>; })}</div>}</main>;
}
