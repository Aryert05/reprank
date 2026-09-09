import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.js';

export default function Login() {
  useDocumentTitle('Log in — RepRank');
  const { values, handleChange } = useForm({ email: '', password: '', remember: false });
  const { toasts, showToast } = useToast();

  function handleSubmit(e) {
    e.preventDefault();
    showToast('Demo only — authentication arrives in a later experiment.');
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

          <button type="submit" className="btn-primary w-full">Log in</button>

          <p className="text-center text-sm text-mist-400">
            Don't have an account?{' '}
            <a href="/register.html" className="font-medium text-volt hover:text-volt-400">Register</a>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-mist-400">
          Experiment 3 demo — this form uses a custom useForm hook, but there's still no backend.
        </p>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
