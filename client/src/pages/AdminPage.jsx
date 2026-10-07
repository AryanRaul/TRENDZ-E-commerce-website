import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

const CATEGORY_OPTIONS = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
  { value: 'trousers', label: 'Trousers' },
  { value: 'clothes', label: 'Clothes' },
  { value: 'dress', label: 'Dress' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'heels', label: 'Heels' }
];
const CATEGORY_BY_GENDER = { men: ['shirt', 'pants', 'trousers', 'clothes', 'shoes'], women: ['shirt', 'pants', 'trousers', 'clothes', 'dress', 'shoes', 'heels'], children: ['shirt', 'pants', 'trousers', 'clothes', 'shoes'] };
const LEGACY_CATEGORY_BY_GENDER = { men: ['shirt'], women: ['shirt'], children: [] };
const categoryLabel = (category) => CATEGORY_OPTIONS.find((option) => option.value === category)?.label || (category === 'shirt' ? 'Shirt' : category);
const GENDER_LABELS = { men: 'Men', women: 'Women', children: 'Kids' };
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['6', '7', '8', '9', '10', '11'];
const emptyForm = { name: '', description: '', sku: '', price: '', originalPrice: '', gender: 'men', category: 'shirt', images: [], sizes: [], sizeStock: {}, status: 'active', featured: false };
const price = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const stockTotal = (product) => Object.values(product.sizeStock || {}).reduce((total, quantity) => total + Number(quantity || 0), 0);
const sizesFor = (category) => category === 'shoes' || category === 'heels' ? FOOTWEAR_SIZES : CLOTHING_SIZES;

function requestMessage(error) {
  if (error.status === 401) return 'Please log in again.';
  if (error.status === 403) return 'You do not have permission to access the admin dashboard.';
  if (error.status === 404) return 'Requested item not found.';
  if (error.status >= 500) return 'Unable to save product. Please try again.';
  return error.message || 'Unable to save product. Please try again.';
}

function asForm(product) {
  return {
    name: product.name,
    description: product.description,
    sku: product.sku || '',
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    gender: product.gender,
    category: product.category === 'shirts' ? 'shirt' : product.category,
    images: product.images || [],
    sizes: product.sizes || [],
    sizeStock: Object.fromEntries(
      Object.entries(product.sizeStock || {}).map(([size, quantity]) => [size, String(quantity)])
    ),
    status: product.status || 'active',
    featured: Boolean(product.featured)
  };
}

export default function AdminPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true); const [ordersLoading, setOrdersLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [deletingId, setDeletingId] = useState(''); const [updatingOrderId, setUpdatingOrderId] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function loadProducts() {
    setLoading(true);
    try { setProducts((await apiRequest('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })).products); }
    catch (requestError) { setError(requestMessage(requestError)); }
    finally { setLoading(false); }
  }
  async function loadOrders() {
    setOrdersLoading(true);
    try { setOrders((await apiRequest('/api/orders', { headers: { Authorization: `Bearer ${token}` } })).orders); }
    catch (requestError) { setError(requestMessage(requestError)); }
    finally { setOrdersLoading(false); }
  }
  useEffect(() => { loadProducts(); loadOrders(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!notice) return undefined; const timeout = window.setTimeout(() => setNotice(''), 4500); return () => window.clearTimeout(timeout); }, [notice]);
  useEffect(() => () => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const metrics = useMemo(() => ({ total: products.length, active: products.filter((p) => p.status === 'active').length, inventory: products.reduce((total, p) => total + stockTotal(p), 0), lowStock: products.filter((p) => stockTotal(p) > 0 && stockTotal(p) <= 5).length }), [products]);
  const categories = CATEGORY_OPTIONS.map((option) => option.value);
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = products.filter((p) => (!term || `${p.name} ${p.description} ${p.gender} ${p.category}`.toLowerCase().includes(term)) && (genderFilter === 'all' || p.gender === genderFilter) && (categoryFilter === 'all' || p.category === categoryFilter));
    return [...filtered].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name) : new Date(b.createdAt) - new Date(a.createdAt));
  }, [products, search, genderFilter, categoryFilter, sort]);
  const availableSizes = sizesFor(form.category);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function resetForm() { setForm(emptyForm); setEditingId(''); setImageFile(null); setImagePreview(''); setError(''); }
  function changeGender(gender) { setForm((current) => ({ ...current, gender, category: CATEGORY_BY_GENDER[gender].includes(current.category) || LEGACY_CATEGORY_BY_GENDER[gender].includes(current.category) ? current.category : CATEGORY_BY_GENDER[gender][0], sizes: [], sizeStock: {} })); }
  function changeCategory(category) { setForm((current) => ({ ...current, category, sizes: [], sizeStock: {} })); }
  function toggleSize(size) {
    setForm((current) => {
      if (current.sizes.includes(size)) { const sizeStock = { ...current.sizeStock }; delete sizeStock[size]; return { ...current, sizes: current.sizes.filter((item) => item !== size), sizeStock }; }
      return { ...current, sizes: [...current.sizes, size], sizeStock: { ...current.sizeStock, [size]: '0' } };
    });
  }
  function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Choose a JPG, PNG, or WEBP image.');
    if (file.size > 5 * 1024 * 1024) return setError('Image must be 5 MB or smaller.');
    setError(''); setImageFile(file); setImagePreview(URL.createObjectURL(file));
  }
  async function uploadImage() {
    if (!imageFile) return form.images[0];
    const data = new FormData(); data.append('image', imageFile);
    return (await apiRequest('/api/admin/uploads/products', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data })).image;
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    const numericPrice = Number(form.price); const numericOriginalPrice = form.originalPrice === '' ? undefined : Number(form.originalPrice);
    if (!form.name.trim() || form.name.trim().length > 160) return setError('Product name is required and must be 160 characters or fewer.');
    if (!form.description.trim()) return setError('Description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError('Price must be a number greater than 0.');
    if (numericOriginalPrice !== undefined && (!Number.isFinite(numericOriginalPrice) || numericOriginalPrice < numericPrice)) return setError('Original price must be greater than or equal to price.');
    if (!editingId && !imageFile) return setError('Select a product image before saving.');
    if (!form.sizes.length) return setError('Choose at least one size and stock quantity.');
    const sizeStock = Object.fromEntries(form.sizes.map((size) => [size, Number(form.sizeStock[size])]));
    if (Object.values(sizeStock).some((quantity) => !Number.isInteger(quantity) || quantity < 0)) return setError('Every stock quantity must be a whole number of 0 or more.');
    setSubmitting(true);
    try {
      const image = await uploadImage();
      const body = { ...form, name: form.name.trim(), description: form.description.trim(), sku: form.sku.trim(), price: numericPrice, ...(numericOriginalPrice !== undefined && { originalPrice: numericOriginalPrice }), images: image ? [image] : form.images, sizeStock };
      await apiRequest(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', { method: editingId ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
      setNotice(editingId ? 'Product updated successfully.' : 'Product added successfully.'); resetForm(); await loadProducts();
    } catch (requestError) { setError(requestMessage(requestError)); }
    finally { setSubmitting(false); }
  }
  function edit(product) { setEditingId(product._id); setForm(asForm(product)); setImageFile(null); setImagePreview(product.images?.[0] || ''); setError(''); setNotice(''); document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  async function remove(product) {
    if (!window.confirm(`Permanently delete ${product.name}? This cannot be restored.`)) return;
    setError(''); setNotice(''); setDeletingId(product._id);
    try { await apiRequest(`/api/admin/products/${product._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setProducts((current) => current.filter((p) => p._id !== product._id)); setNotice('Product permanently deleted.'); }
    catch (requestError) { setError(requestMessage(requestError)); }
    finally { setDeletingId(''); }
  }
  async function advanceOrder(order, orderStatus) {
    setError(''); setNotice(''); setUpdatingOrderId(order._id);
    try {
      const data = await apiRequest(`/api/orders/${order._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ orderStatus }) });
      setOrders((current) => current.map((item) => item._id === data.order._id ? { ...item, orderStatus: data.order.orderStatus } : item));
      setNotice(`${order.orderNumber} updated to ${data.order.orderStatus}.`);
    } catch (requestError) { setError(requestMessage(requestError)); }
    finally { setUpdatingOrderId(''); }
  }
  function orderActions(status) {
    if (status === 'PLACED' || status === 'CONFIRMED') return [{ label: 'Accept', status: 'PROCESSING' }, { label: 'Reject', status: 'CANCELLED', danger: true }];
    if (status === 'PROCESSING') return [{ label: 'Proceed / Ship', status: 'SHIPPED' }, { label: 'Reject', status: 'CANCELLED', danger: true }];
    if (status === 'SHIPPED') return [{ label: 'Mark Delivered', status: 'DELIVERED' }];
    return [];
  }

  return <main className="admin-page" id="dashboard">
    <nav className="admin-nav" aria-label="Admin navigation"><strong>TRENDZ ADMIN</strong><a href="#dashboard">Dashboard</a><a href="#products">Products</a><a href="#orders">Orders</a></nav>
    <header className="admin-heading"><div><p className="eyebrow">ADMIN DASHBOARD</p><h1>Product management</h1><p className="page-intro">Create, update, and monitor your live TRENDZ catalogue.</p></div><button className="form-submit" type="button" onClick={() => { resetForm(); document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>+ Add product</button></header>
    <section className="admin-metrics" aria-label="Catalogue overview"><article><small>Total products</small><strong>{metrics.total}</strong></article><article><small>Active products</small><strong>{metrics.active}</strong></article><article><small>Total stock</small><strong>{metrics.inventory}</strong></article><article><small>Low-stock products</small><strong>{metrics.lowStock}</strong></article></section>
    {notice && <p className="admin-notice" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}
    <section className="admin-workspace">
      <form id="product-form" className="admin-form" onSubmit={submit} noValidate>
  <div className="admin-form-row">
    <label>
      Price (₹)
      <input
        type="number"
        min="1"
        step="1"
        value={form.price}
        onChange={(e) => update('price', e.target.value)}
        required
      />
    </label>

    <label>
      Original price (₹)
      <input
        type="number"
        min="1"
        step="1"
        value={form.originalPrice}
        onChange={(e) => update('originalPrice', e.target.value)}
      />
    </label>

    <label>
      Status
      <select
        value={form.status}
        onChange={(e) => update('status', e.target.value)}
      >
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>
    </label>
  </div>

  <label className="featured-option">
    <input
      type="checkbox"
      checked={form.featured}
      onChange={(e) => update('featured', e.target.checked)}
    />
    <span>
      <strong>Show in home-page slider</strong>
      <small className="field-hint">
        Enable this product to display it in the hero/slider on the home page.
      </small>
    </span>
  </label>

  <section className="admin-form-section">
    <h3>Product image</h3>

    <p className="field-hint">
      JPG, PNG, or WEBP. Maximum file size: 5 MB.
    </p>

    <label className="image-upload">
      <span>Upload image</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={selectImage}
      />
    </label>

    {imagePreview && (
      <img
        className="image-preview"
        src={imagePreview}
        alt="Selected product preview"
      />
    )}
  </section>

  <section className="admin-form-section">
    <h3>Product information</h3>

    <label>
      Product name
      <input
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        maxLength="160"
        required
      />
    </label>

    <label>
      SKU / Product ID
      <small className="field-hint">
        Optional, unique store reference.
      </small>
      <input
        value={form.sku}
        onChange={(e) => update('sku', e.target.value)}
        maxLength="80"
      />
    </label>

    <label>
      Description
      <textarea
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        maxLength="3000"
        required
      />
    </label>

    <div className="admin-form-row">
      <label>
        Gender
        <select
          value={form.gender}
          onChange={(e) => changeGender(e.target.value)}
        >
          {Object.keys(CATEGORY_BY_GENDER).map((gender) => (
            <option key={gender} value={gender}>
              {GENDER_LABELS[gender]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Category
        <select
          value={form.category}
          onChange={(e) => changeCategory(e.target.value)}
        >
          {CATEGORY_BY_GENDER[form.gender].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  </section>

  <section className="admin-form-section">
    <h3>Inventory</h3>

    <p className="field-hint">
      Select only the sizes this product offers, then set stock for each one.
    </p>

    <div className="size-options">
      {availableSizes.map((size) => (
        <label
          key={size}
          className={
            form.sizes.includes(size)
              ? 'size-option selected'
              : 'size-option'
          }
        >
          <input
            type="checkbox"
            checked={form.sizes.includes(size)}
            onChange={() => toggleSize(size)}
          />
          <span>{size}</span>
        </label>
      ))}
    </div>

    {form.sizes.length > 0 && (
      <div className="stock-grid">
        {form.sizes.map((size) => (
          <label key={size}>
            Size {size}
            <input
              type="number"
              min="0"
              step="1"
              value={form.sizeStock[size] ?? '0'}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  sizeStock: {
                    ...current.sizeStock,
                    [size]: e.target.value,
                  },
                }))
              }
            />
          </label>
        ))}
      </div>
    )}
  </section>

  <div className="admin-form-actions">
    <button
      className="form-submit"
      disabled={submitting}
      type="submit"
    >
      {submitting
        ? 'Saving…'
        : editingId
          ? 'Save changes'
          : 'Add product'}
    </button>

    <button
      className="text-button"
      type="button"
      onClick={resetForm}
      disabled={submitting}
    >
      {editingId ? 'Cancel editing' : 'Clear form'}
    </button>
  </div>
</form>
      <section className="admin-products" id="products"><div className="admin-products-heading"><div><p className="eyebrow">PRODUCTS</p><h2>Catalogue</h2></div><span>{visibleProducts.length} of {products.length} items</span></div><div className="admin-filters"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" /><select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} aria-label="Filter by gender"><option value="all">All genders</option>{Object.keys(GENDER_LABELS).map((gender) => <option key={gender} value={gender}>{GENDER_LABELS[gender]}</option>)}</select><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"><option value="newest">Newest</option><option value="name">Name</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div>{loading ? <p className="catalogue-state">Loading products...</p> : !visibleProducts.length ? <p className="catalogue-state">No products found.</p> : <><div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Gender</th><th>Category</th><th>Price</th><th>Sizes</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product._id}><td className="admin-product-cell"><img src={product.images[0]} alt="" /><strong>{product.name}</strong></td><td>{GENDER_LABELS[product.gender] || product.gender}</td><td>{product.category}</td><td>{price(product.price)}</td><td>{product.sizes.join(', ')}</td><td>{stockTotal(product)}</td><td><span className={`status-badge order-${product.status}`}>{product.status}</span></td><td className="admin-actions"><button className="text-button" type="button" onClick={() => edit(product)}>Edit</button><button className="text-button danger-button" type="button" disabled={deletingId === product._id} onClick={() => remove(product)}>{deletingId === product._id ? 'Removing…' : 'Remove'}</button></td></tr>)}</tbody></table></div><div className="admin-product-cards">{visibleProducts.map((product) => <article key={product._id}><img src={product.images[0]} alt="" /><div><p className="eyebrow">{GENDER_LABELS[product.gender]} · {product.category}</p><h3>{product.name}</h3><strong>{price(product.price)}</strong><p><span className={`status-badge order-${product.status}`}>{product.status}</span> · Stock {stockTotal(product)}</p><p className="admin-stock-list">{product.sizes.map((size) => `${size}: ${product.sizeStock[size]}`).join(' · ')}</p><div className="admin-actions"><button className="text-button" type="button" onClick={() => edit(product)}>Edit</button><button className="text-button danger-button" type="button" disabled={deletingId === product._id} onClick={() => remove(product)}>{deletingId === product._id ? 'Removing…' : 'Remove'}</button></div></div></article>)}</div></>}</section>
    </section>
    <section className="admin-products admin-orders" id="orders"><div className="admin-products-heading"><div><p className="eyebrow">ORDERS</p><h2>Order management</h2></div><span>{orders.length} orders</span></div>{ordersLoading ? <p className="catalogue-state">Loading orders...</p> : !orders.length ? <p className="catalogue-state">No orders have been placed yet.</p> : <><div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map((order) => { const actions = orderActions(order.orderStatus); return <tr key={order._id}><td><strong>{order.orderNumber}</strong></td><td>{order.userId?.name || order.userId?.email || 'Customer'}<small className="admin-order-email">{order.userId?.email}</small></td><td>{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td><td>{price(order.totalAmount)}</td><td><span className={`status-badge order-${String(order.orderStatus).toLowerCase()}`}>{order.orderStatus}</span></td><td className="admin-actions">{actions.length ? actions.map((action) => <button className={`text-button${action.danger ? ' danger-button' : ''}`} key={action.status} type="button" disabled={updatingOrderId === order._id} onClick={() => advanceOrder(order, action.status)}>{updatingOrderId === order._id ? 'Updating…' : action.label}</button>) : <span className="admin-order-complete">{order.orderStatus === 'CANCELLED' ? 'Rejected' : 'Complete'}</span>}</td></tr>; })}</tbody></table></div><div className="admin-order-cards">{orders.map((order) => { const actions = orderActions(order.orderStatus); return <article key={order._id}><div><strong>{order.orderNumber}</strong><small>{order.userId?.name || order.userId?.email || 'Customer'} · {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</small></div><strong>{price(order.totalAmount)}</strong><span className={`status-badge order-${String(order.orderStatus).toLowerCase()}`}>{order.orderStatus}</span><div className="admin-actions">{actions.length ? actions.map((action) => <button className={`text-button${action.danger ? ' danger-button' : ''}`} key={action.status} type="button" disabled={updatingOrderId === order._id} onClick={() => advanceOrder(order, action.status)}>{updatingOrderId === order._id ? 'Updating…' : action.label}</button>) : <span className="admin-order-complete">{order.orderStatus === 'CANCELLED' ? 'Rejected' : 'Complete'}</span>}</div></article>; })}</div></>}</section>
  </main>;
}
