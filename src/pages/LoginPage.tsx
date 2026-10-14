import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '../lib/auth-client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        fetchOptions: { credentials: 'include' },
      });

      if (result.error) {
        setError(result.error.message || 'Invalid credentials. Please try again.');
        return;
      }

      // Verify the user actually has admin access by hitting the admin API
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin';
      const check = await fetch(`${apiBase}/overview`, {
        credentials: 'include',
      });

      if (check.status === 403) {
        // Authenticated but not super_admin
        await signIn.email({ email: '', password: '' }).catch(() => {}); // flush
        setError('Access denied: your account does not have admin privileges.');
        return;
      }

      navigate('/', { replace: true });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* ── Ambient glow blobs ─────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, hsl(242 84% 63%) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15"
        style={{
          background:
            'radial-gradient(circle, hsl(262 84% 70%) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Card ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div
          className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          style={{
            backdropFilter: 'blur(12px)',
            background: 'hsl(var(--card) / 0.85)',
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-4 border-b border-border/50 px-8 py-10">
            {/* Logo mark */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, hsl(242 84% 63%), hsl(262 84% 70%))',
                boxShadow: '0 0 0 1px hsl(242 84% 63% / 0.3), 0 8px 24px hsl(242 84% 63% / 0.3)',
              }}
            >
              <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Codeward Admin
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Restricted access · Super admin only
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-8">
            {/* Error banner */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="admin-email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@codeward.cloud"
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ring-0 transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="admin-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-input bg-background px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ring-0 transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="relative mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:
                  'linear-gradient(135deg, hsl(242 84% 63%), hsl(262 84% 70%))',
                boxShadow: isLoading
                  ? 'none'
                  : '0 4px 16px hsl(242 84% 63% / 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in to admin'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-border/50 px-8 py-4">
            <p className="text-center text-xs text-muted-foreground">
              This portal is restricted to authorised personnel only.
              <br />
              Unauthorised access attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
