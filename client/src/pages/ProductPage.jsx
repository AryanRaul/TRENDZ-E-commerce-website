import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const { addItem, isLoading: isCartLoading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setProduct(null); setError(''); setSelectedSize(''); setQuantity(1);
    apiRequest(`/api/products/${id}`).then(({ product: loaded }) => setProduct(loaded)).catch((requestError) => setError(requestError.message));
  }, [id]);

  if (error) return <main className="product-page"><p className="form-error" role="alert">{error}</p><Link to="/">Back to products</Link></main>;
  if (!product) return <main className="product-page"><p>Loading product…</p></main>;
  const stock = selectedSize ? Number(product.sizeStock[selectedSize]) : 0;

  async function handleAdd() {
    setError('');
    if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${id}` } });
    if (!selectedSize) return setError('Choose a size before adding this item.');
    if (quantity > stock) return setError('Requested quantity exceeds available stock.');
    try {
      await addItem(product._id, selectedSize, quantity);
      navigate('/checkout');
    } catch (requestError) { setError(requestError.message); }
  }

  return <main className="product-page"><Link className="back-link" to="/">← Continue shopping</Link><section className="product-detail"><div className="product-media"><img src={product.images[0]} alt={product.name} /></div><div className="product-info"><p className="eyebrow">{product.gender} · {product.category}</p><h1>{product.name}</h1><strong className="product-price">{price(product.price)}</strong><p className="product-description">{product.description}</p><div className="product-divider" /><div className="size-picker"><div className="picker-heading"><h2>Select size</h2><span>{selectedSize ? `Size ${selectedSize}` : 'Required'}</span></div><div>{product.sizes.map((size) => { const sizeStock = Number(product.sizeStock[size]); return <button type="button" key={size} className={selectedSize === size ? 'size-selected' : ''} disabled={sizeStock < 1} onClick={() => { setSelectedSize(size); setQuantity(1); }}><span>{size}</span><small>{sizeStock ? `${sizeStock} left` : 'Out of stock'}</small></button>; })}</div>{selectedSize && <p className={stock > 0 ? 'stock-note' : 'stock-note unavailable'}>{stock > 0 ? `${stock} available in size ${selectedSize}` : 'Out of stock'}</p>}</div><div className="product-action-row"><div className="product-quantity"><span>Quantity</span><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}>−</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={!selectedSize || quantity >= stock} onClick={() => setQuantity((value) => value + 1)}>+</button></div><button type="button" className="form-submit product-add" disabled={isCartLoading || (selectedSize && stock < 1)} onClick={handleAdd}>{isCartLoading ? 'Adding…' : 'Add to bag'}</button></div>{error && <p className="form-error" role="alert">{error}</p>}<p className="product-assurance">Select a size to add this piece to your bag.</p></div></section></main>;
}
