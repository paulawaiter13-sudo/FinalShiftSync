import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { AppLogo } from '../components/ui/AppLogo';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('paula.waiter@shiftsync.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 text-white lg:flex xl:p-12">
        <AppLogo variant="full" size="lg" />
        <div>
          <h1 className="text-2xl font-bold leading-tight xl:text-3xl">
            Structured shift handovers for 24/7 operations
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            Centralize incidents, alerts, tasks, and AI-generated summaries for seamless NOC
            shift transitions.
          </p>
        </div>
        <p className="text-xs text-slate-400">NOC Operations Platform v1.0</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <AppLogo variant="full" size="md" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Use your NOC credentials to access the platform
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Demo: paula.waiter@shiftsync.local / password123
          </p>
        </div>
      </div>
    </div>
  );
}
