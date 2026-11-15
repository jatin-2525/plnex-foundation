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
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-sm overflow-hidden">
        {/* Header with PLnEX branding */}
        <div className="px-6 pt-7 pb-4 text-center border-b border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D]">
          <div className="inline-flex items-center justify-center mb-3">
            <Logo size="lg" showWordmark={false} />
          </div>
          <h1 className="text-xl font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight leading-snug">
            PL<span className="text-[#006B61] dark:text-[#72C6AD]">n</span>EX
          </h1>
          <p className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] uppercase tracking-wider font-mono mt-0.5">
            Planning-to-Execution Bridge
          </p>
          <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1">
            Oil India Limited • Infrastructure Project Controls
          </p>
        </div>

        {/* Success State Overlay / Transition */}
        {loginState === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E4F1E9] dark:bg-[#0D3322] border border-[#B7DAC3] dark:border-[#1E5C3E] flex items-center justify-center text-[#1F6B4E] dark:text-[#34D399] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">Session Authorized</h2>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">
                Access granted. Loading role-specific workspace...
              </p>
            </div>
            <div className="w-full bg-[#D9E2DA] dark:bg-[#243832] h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E7D5B] dark:bg-[#34D399] rounded-full w-full" />
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-[#006B61] dark:text-[#72C6AD] font-medium font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Routing to authorized dashboard...
            </span>
          </div>
        ) : (
          /* Authentication Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-6 space-y-4">
            {/* Server Error Alert Banner */}
            {loginState === 'server_error' && (
              <div className="p-3 bg-[#F6E4E1] dark:bg-[#3D1418] border border-[#DCABA7] dark:border-[#6B2027] rounded-md flex items-start gap-2 text-xs text-[#A43B36] dark:text-[#FF9E94]">
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
              <div className="p-3 bg-[#F6E4E1] dark:bg-[#3D1418] border border-[#DCABA7] dark:border-[#6B2027] rounded-md flex items-start gap-2 text-xs text-[#A43B36] dark:text-[#FF9E94]">
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
              <label htmlFor="work-email" className="block text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                Work Email <span className="text-[#A43B36] dark:text-[#FF9E94]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F6F7F3] dark:bg-[#101815] border rounded-md text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#64748B] focus:bg-white dark:focus:bg-[#243832] outline-none transition-colors ${
                    emailError
                      ? 'border-[#92372F] dark:border-[#F87171] focus:border-[#92372F] bg-[#F6E4E1]/30 dark:bg-[#3D1418]/30'
                      : 'border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD]'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-[#A43B36] dark:text-[#FF9E94] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                  Password <span className="text-[#A43B36] dark:text-[#FF9E94]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#006B61] dark:text-[#72C6AD] hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className={`w-full pl-9 pr-9 py-2 text-xs bg-[#F6F7F3] dark:bg-[#101815] border rounded-md text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#64748B] focus:bg-white dark:focus:bg-[#243832] outline-none transition-colors ${
                    passwordError
                      ? 'border-[#92372F] dark:border-[#F87171] focus:border-[#92372F] bg-[#F6E4E1]/30 dark:bg-[#3D1418]/30'
                      : 'border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#738A80] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] p-1 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-[#A43B36] dark:text-[#FF9E94] flex items-center gap-1 mt-1 font-medium">
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
                  className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#006B61] dark:text-[#72C6AD] focus:ring-[#006B61] w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] disabled:bg-[#006B61]/60 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed mt-2 min-h-[44px]"
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
            <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5]">
              <span>New project engineer?</span>
              <Link
                href="/register"
                className="font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        )}

        {/* Security & Compliance Footer */}
        <div className="px-6 py-3 bg-[#F6F7F3] dark:bg-[#243832] border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center gap-2 text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
          <Shield className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD] flex-shrink-0" />
          <span>Enterprise Multi-Tenant Access Gate · Role-Based Access Control</span>
        </div>
      </div>

      {/* Quick Testing Sandbox Bar (For evaluator testing of all 3 roles) */}
      <details className="mt-4 p-3 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs space-y-2 group">
        <summary className="flex items-center justify-between text-[11px] text-[#52665D] dark:text-[#B5C1B5] font-medium list-none select-none cursor-pointer">
          <span className="font-semibold uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1.5 font-heading">
            <span>Demo Sandbox Credentials</span>
          </span>
          <span className="text-[10px] text-[#006B61] dark:text-[#72C6AD] group-open:hidden">Show Role Presets ▾</span>
          <span className="text-[10px] text-[#006B61] dark:text-[#72C6AD] hidden group-open:inline">Hide Role Presets ▴</span>
        </summary>
        <div className="pt-2 text-xs space-y-2">
          <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
            Select a verified persona to test role-based navigation and views:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('manager')}
              className="px-2.5 py-1 bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9EBF2] dark:hover:bg-[#253954] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Manager (/dashboard)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('engineer')}
              className="px-2.5 py-1 bg-[#E4F1E9] dark:bg-[#0D3322] hover:bg-[#B8DCC9]/40 dark:hover:bg-[#1E5C3E]/60 text-[#1F6B4E] dark:text-[#34D399] border border-[#B7DAC3] dark:border-[#1E5C3E] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Site Engineer (/engineer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2.5 py-1 bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA]/40 dark:hover:bg-[#253954] text-[#2C6475] dark:text-[#E5C185] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
            >
              Pre-fill as Admin (/admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('invalid')}
              className="px-2.5 py-1 bg-[#F6E4E1] dark:bg-[#3D1418] hover:bg-[#F6E4E1]/80 dark:hover:bg-[#3D1418]/80 text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#6B2027] rounded text-[11px] font-mono transition-colors cursor-pointer"
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
        <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-center gap-2 p-4 text-sm text-[#52665D] dark:text-[#B5C1B5]" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#006B61] dark:text-[#72C6AD] shrink-0" />
          <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">Loading session...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
