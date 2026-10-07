import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <main className="account-page">
      <p className="eyebrow">MY ACCOUNT</p>
      <h1>Hello, {user.name}</h1>
      <p className="page-intro">Your personal TRENDS space.</p>
      <section className="account-card" aria-label="Account information">
        <div className="account-card-heading"><span>{user.name.charAt(0).toUpperCase()}</span><div><p className="eyebrow">PROFILE</p><h2>Account information</h2></div></div>
        <dl><div><dt>Name</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div></dl>
      </section>
    </main>
  );
}
