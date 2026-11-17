import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { finishLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const path = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup ? { name, email, password } : { email, password };
      const { data } = await api.post(path, payload);
      finishLogin(data.token, data.user);
      toast.success(isSignup ? 'Your account is ready!' : 'Welcome back!');
      navigate('/today', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-background grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(54,58,98,0.12)] dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-10 text-white md:flex lg:p-14">
          <Link to="/login" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <span className="text-lg font-bold">Daily Tracker</span>
          </Link>
          <div className="my-12">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
              <Sparkles size={14} aria-hidden="true" /> Your days, with intention
            </p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Make room for the things that matter.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-indigo-100/85">
              A calm place to turn everyday plans into steady progress.
            </p>
          </div>
          <p className="text-sm text-indigo-100/65">One day at a time. You’ve got this.</p>
          <div className="pointer-events-none absolute -translate-y-8 translate-x-52 opacity-10">
            <Sparkles size={210} strokeWidth={0.6} />
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10 md:px-9 lg:px-14 lg:py-14">
          <div className="mb-8 md:hidden">
            <Link to="/login" className="inline-flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Sparkles size={19} aria-hidden="true" />
              </span>
              <span className="font-bold text-slate-900 dark:text-white">Daily Tracker</span>
            </Link>
          </div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            {isSignup ? 'Start your fresh routine' : 'Welcome back'}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {isSignup
              ? 'Build a rhythm that feels good, one day at a time.'
              : 'Your goals and routines are right where you left them.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignup && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your name
                </span>
                <input
                  className="field-control"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sam"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email address
              </span>
              <input
                className="field-control"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
              </span>
              <span className="relative block">
                <input
                  className="field-control pr-12"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="icon-button absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <button
              type="submit"
              className="primary-button mt-2 w-full py-3"
              disabled={submitting}
            >
              {submitting
                ? 'Please wait…'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
              {!submitting && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
            {isSignup ? 'Already have an account?' : 'New to Daily Tracker?'}{' '}
            <Link
              to={isSignup ? '/login' : '/signup'}
              className="font-semibold text-indigo-600 hover:text-violet-600 dark:text-indigo-300"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
