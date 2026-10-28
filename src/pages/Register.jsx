import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.js';
import { registerUser } from '../services/auth.js';

export default function Register() {
  useDocumentTitle('Create your account — RepRank');
  const { values, handleChange } = useForm({ name: '', email: '', password: '', confirmPassword: '' });
  const { toasts, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mismatch = values.confirmPassword.length > 0 && values.password !== values.confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side validation before hitting the API
    if (!values.name.trim() || !values.email.trim() || !values.password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (values.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      showToast('Account created — log in to continue.');
      // Successful registration navigates to the login page
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 800);
    } catch (err) {
      const message = err?.message || 'Registration failed. Please try again.';
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout nav="marketing">
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-volt font-display text-xl font-bold text-ink-950">R</span>
          <h1 className="mt-4 text-2xl font-semibold text-mist-100">Create your account</h1>
          <p className="mt-1 text-sm text-mist-400">Start at Level 1. Everyone does.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="field-label">Full name</label>
            <input
              id="name" name="name" type="text" autoComplete="name" placeholder="Aditi Sharma"
              className="field-input" value={values.name} onChange={handleChange} required
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="field-label">Email</label>
            <input
              id="reg-email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
              className="field-input" value={values.email} onChange={handleChange} required
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="field-label">Password</label>
            <input
              id="reg-password" name="password" type="password" autoComplete="new-password" placeholder="••••••••"
              className="field-input" value={values.password} onChange={handleChange} required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="field-label">Confirm password</label>
            <input
              id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••"
              className="field-input" value={values.confirmPassword} onChange={handleChange} required
            />
            {mismatch && <p className="mt-1.5 text-xs text-volt">Passwords don't match yet.</p>}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-center text-sm text-mist-400">
            Already have an account?{' '}
            <a href="/login.html" className="font-medium text-volt hover:text-volt-400">Log in</a>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-mist-400">
          Account creation powered by the RepRank API (POST /api/users/register).
        </p>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
