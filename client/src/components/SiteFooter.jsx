import { Link, useLocation } from 'react-router-dom';

export default function SiteFooter() {
  const { pathname } = useLocation();
  if (pathname === '/login' || pathname === '/register' || pathname === '/admin') return null;
  return <footer className="site-footer"><div><Link className="brand" to="/"><span>Trend</span>z</Link><p>Thoughtful everyday fashion for every style.</p></div><div><strong>Shop</strong><Link to="/?search=men">Men</Link><Link to="/?search=women">Women</Link><Link to="/?search=children">Kids</Link></div><div><strong>Customer support</strong><a href="mailto:support@trendz.example">Contact</a><a href="#faq">FAQ</a><a href="#shipping">Shipping</a><a href="#returns">Returns</a></div><div><strong>Account</strong><Link to="/login">Login</Link><Link to="/register">Register</Link><Link to="/orders">Orders</Link></div><div><strong>Legal</strong><a href="#privacy">Privacy policy</a><a href="#terms">Terms & conditions</a></div><p className="site-footer-copy">© 2026 TRENDZ. All rights reserved.</p></footer>;
}
