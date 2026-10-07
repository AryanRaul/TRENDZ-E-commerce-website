import Chatbot from './components/Chatbot';
import { Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrdersPage from './pages/OrdersPage';
import ProductPage from './pages/ProductPage';
import AdminPage from './pages/AdminPage';
import ReceiptPage from './pages/ReceiptPage';
import SiteFooter from './components/SiteFooter';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
          <Route path="/receipt/:id" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <SiteFooter />
	<Chatbot />
      </CartProvider>
    </AuthProvider>
  );
}
