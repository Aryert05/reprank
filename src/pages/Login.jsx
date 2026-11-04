import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.js';
import { getAuthErrorMessage, loginUser, saveAuthSession } from '../services/auth.js';
import { useUser } from '../context/UserContext.jsx';

const DEMO_ACCOUNTS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true';

export default function Login() {
  useDocumentTitle('Log in — RepRank');
  const { values, handleChange, setField } = useForm({
    email: '',
    password: '',
    remember: true,
  });
  const { toasts, showToast } = useToast();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [demoState, setDemoState] = useState({
    status: DEMO_ACCOUNTS_ENABLED ? 'loading' : 'disabled',
    accounts: [],
  });

  useEffect(() => {
    if (!DEMO_ACCOUNTS_ENABLED) return undefined;

    let cancelled = false;
    import('../data/demoAccounts.js')
      .then(({ DEMO_ACCOUNTS }) => {
        if (cancelled) return;
        setDemoState({
          status: DEMO_ACCOUNTS.length ? 'ready' : 'empty',
          accounts: DEMO_ACCOUNTS,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDemoState({ status: 'error', accounts: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setForgotMessage('');

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
        saveAuthSession({ token, user, remember: Boolean(values.remember) });
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
      const message = getAuthErrorMessage(
        err,
        'Login failed. Please check your credentials and try again.',
      );
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    const message =
      'Password recovery is not implemented yet. Register a new account or contact the site administrator.';
    setForgotMessage(message);
    showToast(message);
  }

  function selectDemoAccount(account) {
    setField('email', account.email);
    setField('password', account.password);
    setError('');
    setForgotMessage('');
    showToast(`${account.label} selected. Press “Log in” to continue.`);
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
            <div
              role="alert"
              className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200"
            >
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
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="field-label">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-volt hover:text-volt-400"
              >
                Forgot password?
                <span className="rounded-full border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist-400">
                  Not available
                </span>
              </button>
            </div>
            <input
              id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••"
              className="field-input" value={values.password} onChange={handleChange} required
              aria-describedby={forgotMessage ? 'password-recovery-note' : undefined}
            />
            {forgotMessage && (
              <p id="password-recovery-note" role="status" className="mt-2 text-xs leading-relaxed text-mist-400">
                {forgotMessage}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                id="remember" name="remember" type="checkbox" checked={values.remember} onChange={handleChange}
                className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-volt focus:ring-volt"
                aria-describedby="remember-help"
              />
              <label htmlFor="remember" className="text-sm text-mist-300">Keep me logged in</label>
            </div>
            <p id="remember-help" className="mt-1.5 pl-6 text-xs text-mist-400">
              {values.remember
                ? 'Your session is stored on this device until the token expires.'
                : 'Your session is kept only for this browser tab.'}
            </p>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <p className="text-center text-sm text-mist-400">
            Don't have an account?{' '}
            <a href="/register.html" className="font-medium text-volt hover:text-volt-400">Register</a>
          </p>
        </form>

        {demoState.status !== 'disabled' && (
          <section
            aria-labelledby="demo-accounts-heading"
            className="mt-5 rounded-2xl border border-volt/30 bg-volt/[0.06] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="demo-accounts-heading" className="font-display text-sm font-semibold uppercase tracking-wider text-volt-400">
                  Try a demo account
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-mist-400">
                  Local development only. Selecting an account fills the form; you still log in through the API.
                </p>
              </div>
              <span className="badge badge-xp shrink-0">Local</span>
            </div>

            {demoState.status === 'loading' && (
              <div role="status" className="mt-4 animate-pulse rounded-xl border border-ink-600 bg-ink-800/70 p-3">
                <div className="h-3 w-28 rounded bg-ink-600" />
                <div className="mt-2 h-3 w-48 max-w-full rounded bg-ink-700" />
                <span className="sr-only">Loading demo accounts...</span>
              </div>
            )}

            {demoState.status === 'error' && (
              <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                Demo accounts could not be loaded. You can still enter your own credentials above.
              </p>
            )}

            {demoState.status === 'empty' && (
              <p className="mt-4 text-xs text-mist-400">
                No demo accounts are configured in this build.
              </p>
            )}

            {demoState.status === 'ready' && (
              <div className="mt-4 space-y-2">
                {demoState.accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => selectDemoAccount(account)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-ink-600 bg-ink-800/80 p-3 text-left transition-colors hover:border-volt/60 hover:bg-volt/10"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-volt/15 font-mono text-xs font-semibold text-volt-400">
                      DM
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-mist-100">{account.label}</span>
                        <span className="rounded-full border border-ink-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist-400">
                          {account.roleLabel}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-xs text-mist-400">
                        {account.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-volt group-hover:text-volt-400">
                      Use
                    </span>
                  </button>
                ))}
                <p className="pt-1 text-[11px] leading-relaxed text-mist-400">
                  Seed this account once from <span className="font-mono text-mist-300">backend/</span> with{' '}
                  <span className="font-mono text-mist-300">npm run seed:demo</span>. Demo accounts are never created automatically.
                </p>
              </div>
            )}
          </section>
        )}

        <p className="mt-6 text-center text-xs text-mist-400">
          Authentication powered by the RepRank API (POST /api/users/login).
        </p>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
