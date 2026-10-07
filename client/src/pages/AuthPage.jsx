import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && form.name.trim().length < 2) return setError('Name must be at least 2 characters long.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) return setError('Password must include uppercase, lowercase, number, and special characters.');
    if (isRegister && form.password !== form.confirmPassword) return setError('Password and confirm password must match.');
    setIsSubmitting(true);
    try {
      const authenticatedUser = await (isRegister ? register({ ...form, name: form.name.trim(), email: form.email.trim() }) : login({ email: form.email.trim(), password: form.password }));
      navigate(location.state?.from || (authenticatedUser.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-hidden="true"><p className="eyebrow">TRENDS MEMBERS</p><h2>Made for<br />your everyday.</h2><p>Save your bag, keep track of every order, and make your next find feel effortless.</p></section>
      <section className="auth-card">
        <p className="eyebrow">TRENDS ACCOUNT</p>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p>{isRegister ? 'Create an account to keep your TRENDS profile ready.' : 'Sign in to view your TRENDS account and orders.'}</p>
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && <label>Name<input name="name" value={form.name} onChange={updateField} autoComplete="name" required /></label>}
          <label>Email<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegister ? 'new-password' : 'current-password'} required />{isRegister && <small className="field-hint">8+ characters, with uppercase, lowercase, number, and special character.</small>}</label>
          {isRegister && <label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" required /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to TRENDS?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create one'}</Link></p>
      </section>
    </main>
  );
}
