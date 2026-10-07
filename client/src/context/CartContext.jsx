import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../config/api';
import { useAuth } from './AuthContext';

const emptyCart = { items: [], totalQuantity: 0, subtotal: 0 };
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });
  const resetCart = () => { setCart(emptyCart); setError(''); };

  const refreshCart = async () => {
    if (!token) return emptyCart;
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/cart', { headers: authHeaders() });
      setCart(data.cart);
      setError('');
      return data.cart;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      resetCart();
      return;
    }
    refreshCart().catch(() => {});
  }, [isAuthenticated, isAuthLoading, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutateCart = async (path, options) => {
    if (!token) return { requiresLogin: true };
    setIsLoading(true);
    try {
      const data = await apiRequest(path, { ...options, headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      setCart(data.cart);
      setError('');
      return data.cart;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    cart,
    error,
    isLoading,
    refreshCart,
    addItem: (productId, size, quantity = 1) => mutateCart('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, size, quantity }) }),
    updateItem: (productId, size, quantity) => mutateCart(`/api/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ size, quantity }) }),
    removeItem: (productId, size) => mutateCart(`/api/cart/items/${productId}?size=${encodeURIComponent(size || '')}`, { method: 'DELETE' }),
    clearCart: () => mutateCart('/api/cart', { method: 'DELETE' })
  }), [cart, error, isLoading, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider.');
  return context;
}
