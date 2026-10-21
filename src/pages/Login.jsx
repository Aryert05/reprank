import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.js';
import { loginUser, saveAuthSession } from '../services/auth.js';
import { useUser } from '../context/UserContext.jsx';

export default function Login() {
  useDocumentTitle('Log in — RepRank');
  const { values, handleChange } = useForm({ email: '', password: '', remember: false });
  const { toasts, showToast } = useToast();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!values.email || !values.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({
        email: values.email.trim(),
        password: values.password,
      });

      const token = result?.token;
      const user = result?.user || result;

      if (token) {
        saveAuthSession({ token, user });
      }
      if (user) {
        setUser(user);
      }

      showToast('Login successful. Redirecting...');
      // Follow existing app navigation pattern
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 600);
    } catch (err) {
      const message = err?.message || 'Login failed. Please check your credentials and try again.';
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    showToast("Password reset isn't wired up yet — this experiment is UI + hooks only.");
  }

  return (
    <Layout nav="marketing">
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-volt font-display text-xl font-bold text-ink-950">R</span>
          <h1 className="mt-4 text-2xl font-semibold text-mist-100">Welcome back</h1>
          <p className="mt-1 text-sm text-mist-400">Log in to keep your streak alive.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
              className="field-input" value={values.email} onChange={handleChange} required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="field-label">Password</label>
              <a href="#" onClick={handleForgotPassword} className="text-xs font-medium text-volt hover:text-volt-400">
                Forgot password?
              </a>
            </div>
            <input
              id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••"
              className="field-input" value={values.password} onChange={handleChange} required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember" name="remember" type="checkbox" checked={values.remember} onChange={handleChange}
              className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-volt focus:ring-volt"
            />
            <label htmlFor="remember" className="text-sm text-mist-300">Keep me logged in</label>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <p className="text-center text-sm text-mist-400">
            Don't have an account?{' '}
            <a href="/register.html" className="font-medium text-volt hover:text-volt-400">Register</a>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-mist-400">
          Authentication powered by the RepRank API (POST /api/users/login).
        </p>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
