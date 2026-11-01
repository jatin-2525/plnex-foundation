'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { canAccessRoute, getDefaultRouteForRole } from '../../types/permissions';
import { Logo } from '../../components/shared/Logo';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  ArrowRight,
} from 'lucide-react';

type LoginState = 'idle' | 'submitting' | 'invalid_credentials' | 'validation_error' | 'server_error' | 'success';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const { login } = useApp();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email.trim()) {
      setEmailError('Work email is required');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid corporate or project email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setLoginState('validation_error');
      return;
    }

    setLoginState('submitting');
    setErrorMessage(null);

    // Call authentication service
    setTimeout(() => {
      const res = login(email, password, rememberSession);

      if (!res.success || !res.session) {
        if (email.toLowerCase().includes('servererror') || res.error?.includes('500')) {
          setLoginState('server_error');
          setErrorMessage(res.error || 'Authentication Gateway Error (500)');
        } else {
          setLoginState('invalid_credentials');
          setErrorMessage(res.error || 'The work email or password entered does not match authorized project records.');
        }
        return;
      }

      setLoginState('success');
      const user = res.session.user;

      addToast({
        type: 'success',
        title: `Welcome, ${user.name}`,
        description: `Authorized session established (${user.role.toUpperCase()}). Loading dashboard...`,
      });

      // Role-specific landing:
      // Manager -> /dashboard
      // Site Engineer -> /engineer
      // Admin -> /admin
      let targetRoute = getDefaultRouteForRole(user.role);

      // If user was navigating to a permitted returnUrl, preserve that safe destination
      if (returnUrl && returnUrl !== '/' && returnUrl !== '/login') {
        if (canAccessRoute(user.role, returnUrl)) {
          targetRoute = returnUrl;
        }
      }

      setTimeout(() => {
        router.replace(targetRoute);
      }, 700);
    }, 400);
  };

  // Pre-fill helpers for test convenience
  const handleQuickFill = (type: 'manager' | 'engineer' | 'admin' | 'invalid' | 'server') => {
    if (type === 'manager') {
      setEmail('rajesh.sharma@oilindia.in');
      setPassword('Project2026!');
      setEmailError(null);
      setPasswordError(null);
      setErrorMessage(null);
      setLoginState('idle');
    } else if (type === 'engineer') {
      setEmail('debajit.borah@oilindia.in');
      setPassword('Field2026!');
      setEmailError(null);
      setPasswordError(null);
      setErrorMessage(null);
      setLoginState('idle');
    } else if (type === 'admin') {
      setEmail('admin@oilindia.in');
      setPassword('Admin2026!');
      setEmailError(null);
      setPasswordError(null);
      setErrorMessage(null);
      setLoginState('idle');
    } else if (type === 'invalid') {
      setEmail('unauthorized.user@oilindia.in');
      setPassword('wrongpassword');
      setEmailError(null);
      setPasswordError(null);
      setErrorMessage(null);
      setLoginState('idle');
    } else if (type === 'server') {
      setEmail('servererror@oilindia.in');
      setPassword('Project2026!');
      setEmailError(null);
      setPasswordError(null);
      setErrorMessage(null);
      setLoginState('idle');
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto py-8">
      {/* Centered Authentication Panel */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden">
        {/* Header with PLnEX branding */}
        <div className="px-6 pt-7 pb-4 text-center border-b border-[#D8E2EA] bg-white">
          <div className="inline-flex items-center justify-center mb-3">
            <Logo size="lg" showWordmark={false} />
          </div>
          <h1 className="text-xl font-bold text-[#142C3F] tracking-tight leading-snug">
            PL<span className="text-[#0F6B68]">n</span>EX
          </h1>
          <p className="text-xs font-semibold text-[#0F6B68] uppercase tracking-wider font-mono mt-0.5">
            Planning-to-Execution Bridge
          </p>
          <p className="text-[11px] text-[#526779] mt-1">
            Oil India Limited • Infrastructure Project Controls
          </p>
        </div>

        {/* Success State Overlay / Transition */}
        {loginState === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E4F4EC] border border-[#B8DCC9] flex items-center justify-center text-[#2E7D5B] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142C3F]">Session Authorized</h2>
              <p className="text-xs text-[#526779] mt-1">
                Access granted. Loading role-specific workspace...
              </p>
            </div>
            <div className="w-full bg-[#D8E2EA] h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E7D5B] rounded-full w-full" />
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-[#0F6B68] font-medium font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Routing to authorized dashboard...
            </span>
          </div>
        ) : (
          /* Authentication Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-6 space-y-4">
            {/* Server Error Alert Banner */}
            {loginState === 'server_error' && (
              <div className="p-3 bg-[#FCE8E4] border border-[#E4B0AA] rounded-md flex items-start gap-2 text-xs text-[#A24335]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Authentication Gateway Error (500)</strong>
                  <span className="text-[11px] opacity-90 leading-tight">
                    {errorMessage || 'Unable to establish secure handshake with IAM directory. Please retry.'}
                  </span>
                </div>
              </div>
            )}

            {/* Invalid Credentials Alert Banner */}
            {loginState === 'invalid_credentials' && (
              <div className="p-3 bg-[#FCE8E4] border border-[#E4B0AA] rounded-md flex items-start gap-2 text-xs text-[#A24335]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Invalid Credentials</strong>
                  <span className="text-[11px] opacity-90 leading-tight">
                    {errorMessage || 'The work email or password entered does not match authorized project records.'}
                  </span>
                </div>
              </div>
            )}

            {/* Work Email Field */}
            <div className="space-y-2">
              <label htmlFor="work-email" className="block text-xs font-semibold text-[#142C3F]">
                Work Email <span className="text-[#A24335]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="work-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                    if (loginState !== 'idle' && loginState !== 'submitting') setLoginState('idle');
                  }}
                  disabled={loginState === 'submitting'}
                  placeholder="name@oilindia.in"
                  autoComplete="username"
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F3F6FA] border rounded-md text-[#142C3F] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                    emailError
                      ? 'border-[#A24335] focus:border-[#A24335] bg-[#FCE8E4]/30'
                      : 'border-[#D8E2EA] focus:border-[#0F6B68]'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-[#A24335] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[#142C3F]">
                  Password <span className="text-[#A24335]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#0F6B68] hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (loginState !== 'idle' && loginState !== 'submitting') setLoginState('idle');
                  }}
                  disabled={loginState === 'submitting'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-9 py-2 text-xs bg-[#F3F6FA] border rounded-md text-[#142C3F] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                    passwordError
                      ? 'border-[#A24335] focus:border-[#A24335] bg-[#FCE8E4]/30'
                      : 'border-[#D8E2EA] focus:border-[#0F6B68]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#142C3F] p-1 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-[#A24335] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Remember Session Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  disabled={loginState === 'submitting'}
                  className="rounded border-[#D8E2EA] text-[#0F6B68] focus:ring-[#0F6B68] w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs text-[#526779]">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#0F6B68] hover:bg-[#135A72] disabled:bg-[#0F6B68]/60 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {loginState === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to PLnEX</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Bottom Links */}
            <div className="pt-3 border-t border-[#D8E2EA] flex items-center justify-between text-xs text-[#526779]">
              <span>New project engineer?</span>
              <Link
                href="/register"
                className="font-semibold text-[#0F6B68] hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        )}

        {/* Security & Compliance Footer */}
        <div className="px-6 py-3 bg-[#F3F6FA] border-t border-[#D8E2EA] flex items-center justify-center gap-2 text-[11px] text-[#526779]">
          <Shield className="w-3.5 h-3.5 text-[#0F6B68] flex-shrink-0" />
          <span>Enterprise Multi-Tenant Access Gate · Role-Based Access Control</span>
        </div>
      </div>

      {/* Quick Testing Sandbox Bar (For evaluator testing of all 3 roles) */}
      <details className="mt-4 p-3 bg-white border border-[#D8E2EA] rounded-lg text-xs space-y-2 group">
        <summary className="flex items-center justify-between text-[11px] text-[#526779] font-medium list-none select-none cursor-pointer">
          <span className="font-semibold uppercase tracking-wider text-[#142C3F] flex items-center gap-1.5">
            <span>Demo Sandbox Credentials</span>
          </span>
          <span className="text-[10px] text-[#0F6B68] group-open:hidden">Show Role Presets ▾</span>
          <span className="text-[10px] text-[#0F6B68] hidden group-open:inline">Hide Role Presets ▴</span>
        </summary>
        <div className="pt-2 text-xs space-y-2">
          <p className="text-[11px] text-[#526779]">
            Select a verified persona to test role-based navigation and views:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('manager')}
              className="px-2.5 py-1 bg-[#EAF0F5] hover:bg-[#D9EBF2] text-[#0F6B68] border border-[#D8E2EA] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Manager (/dashboard)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('engineer')}
              className="px-2.5 py-1 bg-[#E4F4EC] hover:bg-[#B8DCC9]/40 text-[#2E7D5B] border border-[#B8DCC9] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Site Engineer (/engineer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2.5 py-1 bg-[#EAF0F5] hover:bg-[#D8E2EA]/40 text-[#3B6EA8] border border-[#D8E2EA] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Admin (/admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('invalid')}
              className="px-2.5 py-1 bg-[#FCE8E4] hover:bg-[#FCE8E4]/80 text-[#A24335] border border-[#E4B0AA] rounded text-[11px] font-mono transition-colors cursor-pointer"
            >
              Invalid Creds
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center gap-2 p-4 text-sm text-[#526779]" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F6B68] shrink-0" />
          <span className="font-medium text-[#142C3F]">Loading session...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
