import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState(new URLSearchParams(location.search).get('search') || '');

  useEffect(() => { setSearch(new URLSearchParams(location.search).get('search') || ''); }, [location.search]);

  function handleLogout() {
    logout();
    setIsMenuOpen(false);
    navigate('/', { replace: true });
  }

  const closeMenu = () => setIsMenuOpen(false);
  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/?search=${encodeURIComponent(query)}` : '/');
    closeMenu();
  }

  return (
    <header className={`app-header${isAuthPage ? ' auth-header' : ''}`}>
      <Link className="brand" to="/" onClick={closeMenu}><span>Trend</span>z</Link>
      {!isAuthPage && <form className="header-search" role="search" onSubmit={submitSearch}><label className="sr-only" htmlFor="site-search">Search products</label><span aria-hidden="true">⌕</span><input id="site-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search collection" /><button type="submit">Search</button></form>}
      {!isAuthPage && <button className="menu-toggle" type="button" aria-expanded={isMenuOpen} aria-controls="main-navigation" onClick={() => setIsMenuOpen((open) => !open)}>
        <span className="sr-only">Toggle navigation</span><i /><i /><i />
      </button>}
      {!isAuthPage && <nav id="main-navigation" className={isMenuOpen ? 'nav-open' : ''} aria-label="Main navigation">
        <NavLink to="/" end onClick={closeMenu}>Shop</NavLink>
        {isAuthenticated ? <>{user?.role === 'admin' && <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>}<NavLink to="/orders" onClick={closeMenu}>Orders</NavLink><NavLink to="/account" onClick={closeMenu}>Account</NavLink><Link className="cart-link" to="/cart" onClick={closeMenu}>Bag</Link><button type="button" onClick={handleLogout}>Logout</button></> : <><Link className="cart-link" to="/cart" onClick={closeMenu}>Bag</Link><NavLink to="/login" onClick={closeMenu}>Login</NavLink><NavLink className="nav-primary" to="/register" onClick={closeMenu}>Register</NavLink></>}
      </nav>}
    </header>
  );
}
