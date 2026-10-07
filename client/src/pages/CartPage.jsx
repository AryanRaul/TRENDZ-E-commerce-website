import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, error, isLoading, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <main className="cart-page"><section className="empty-cart"><p className="eyebrow">YOUR CART</p><h1>Sign in to see your cart.</h1><p>Your cart is saved securely to your TRENDS account.</p><Link className="form-submit cart-login" to="/login" state={{ from: '/cart' }}>Sign in</Link></section></main>;
  }

  async function changeQuantity(item, quantity) {
    try {
      if (quantity < 1) await removeItem(item.productId, item.size);
      else await updateItem(item.productId, item.size, quantity);
    } catch {}
  }

  if (!cart.items.length && !isLoading) {
    return <main className="cart-page"><section className="empty-cart"><p className="eyebrow">YOUR CART</p><h1>Your cart is empty.</h1><p>Browse the TRENDS collection and add something you love.</p><button type="button" className="form-submit" onClick={() => navigate('/')}>Browse products</button></section></main>;
  }

  return (
    <main className="cart-page">
      <div className="cart-heading"><div><p className="eyebrow">YOUR CART</p><h1>Shopping bag</h1></div>{cart.items.length > 0 && <button type="button" className="text-button" onClick={() => clearCart().catch(() => {})}>Clear cart</button>}</div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {cart.legacyItemError && <p className="form-error" role="alert">{cart.legacyItemError}</p>}
      {cart.unavailableItemError && <p className="form-error" role="alert">{cart.unavailableItemError}</p>}
      <section className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => <article className="cart-item" key={`${item.productId}-${item.size}`}>
            {item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} /> : <div className="cart-image-placeholder" aria-hidden="true" />}
            <div className="cart-item-info"><p className="cart-item-category">{item.product.unavailable ? 'Unavailable' : item.product.category}</p><h2>{item.product.name}</h2><p><span className="size-badge">Size {item.size || 'Selection needed'}</span> {!item.product.unavailable && <span>{price(item.product.price)}</span>}</p>{!item.product.unavailable && <div className="quantity-controls"><button type="button" aria-label={`Decrease ${item.product.name} quantity`} disabled={isLoading} onClick={() => changeQuantity(item, item.quantity - 1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.product.name} quantity`} disabled={isLoading} onClick={() => changeQuantity(item, item.quantity + 1)}>+</button></div>}<button type="button" className="text-button" disabled={isLoading} onClick={() => removeItem(item.productId, item.size).catch(() => {})}>Remove</button></div>
            <strong>{item.product.unavailable ? 'Unavailable' : price(item.product.price * item.quantity)}</strong>
          </article>)}
        </div>
        <aside className="cart-summary"><p className="summary-eyebrow">ORDER SUMMARY</p><h2>Ready when you are</h2><p><span>Items</span><span>{cart.totalQuantity}</span></p><p><span>Delivery</span><span>Calculated at checkout</span></p><p className="cart-total"><span>Subtotal</span><strong>{price(cart.subtotal)}</strong></p>{cart.legacyItemError || cart.unavailableItemError ? <p className="checkout-blocked">Remove unavailable items before checkout.</p> : <Link className="form-submit checkout-link" to="/checkout">Secure checkout <span>→</span></Link>}<small>Taxes, delivery, discounts, and payment are calculated later.</small></aside>
      </section>
    </main>
  );
}
