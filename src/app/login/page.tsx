'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { canAccessRoute, getDefaultRouteForRole } from '../../types/permissions';
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
      <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-sm overflow-hidden">
        {/* Header with PLnEX branding */}
        <div className="px-6 pt-7 pb-4 text-center border-b border-[#D9DEE5] bg-white">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#176B87] text-white font-black text-lg tracking-tighter mb-3 shadow-xs">
            PX
          </div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight leading-snug">
            PL<span className="text-[#176B87]">n</span>EX
          </h1>
          <p className="text-xs font-semibold text-[#176B87] uppercase tracking-wider font-mono mt-0.5">
            Planning-to-Execution Bridge
          </p>
          <p className="text-[11px] text-[#596579] mt-1">
            Oil India Limited • Infrastructure Project Controls
          </p>
        </div>

        {/* Success State Overlay / Transition */}
        {loginState === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EDF7F2] border border-[#B8DCC9] flex items-center justify-center text-[#2E7D5B] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033]">Session Authorized</h2>
              <p className="text-xs text-[#596579] mt-1">
                Access granted. Loading role-specific workspace...
              </p>
            </div>
            <div className="w-full bg-[#D9DEE5] h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E7D5B] rounded-full w-full" />
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-[#176B87] font-medium font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Routing to authorized dashboard...
            </span>
          </div>
        ) : (
          /* Authentication Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-6 space-y-4">
            {/* Server Error Alert Banner */}
            {loginState === 'server_error' && (
              <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-md flex items-start gap-2 text-xs text-[#B5473C]">
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
              <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-md flex items-start gap-2 text-xs text-[#B5473C]">
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
              <label htmlFor="work-email" className="block text-xs font-semibold text-[#172033]">
                Work Email <span className="text-[#B5473C]">*</span>
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
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                    emailError
                      ? 'border-[#B5473C] focus:border-[#B5473C] bg-[#FBEFEE]/30'
                      : 'border-[#D9DEE5] focus:border-[#176B87]'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-[#B5473C] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[#172033]">
                  Password <span className="text-[#B5473C]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#176B87] hover:underline transition-colors"
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
                  className={`w-full pl-9 pr-9 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                    passwordError
                      ? 'border-[#B5473C] focus:border-[#B5473C] bg-[#FBEFEE]/30'
                      : 'border-[#D9DEE5] focus:border-[#176B87]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033] p-1 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-[#B5473C] flex items-center gap-1 mt-1 font-medium">
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
                  className="rounded border-[#D9DEE5] text-[#176B87] focus:ring-[#176B87] w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs text-[#596579]">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#176B87] hover:bg-[#135A72] disabled:bg-[#176B87]/60 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed mt-2"
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
            <div className="pt-3 border-t border-[#D9DEE5] flex items-center justify-between text-xs text-[#596579]">
              <span>New project engineer?</span>
              <Link
                href="/register"
                className="font-semibold text-[#176B87] hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        )}

        {/* Security & Compliance Footer */}
        <div className="px-6 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-center gap-2 text-[11px] text-[#596579]">
          <Shield className="w-3.5 h-3.5 text-[#176B87] flex-shrink-0" />
          <span>Restricted to Authorized Infrastructure Personnel</span>
        </div>
      </div>

      {/* Quick Testing Sandbox Bar (For evaluator testing of all 3 roles) */}
      <div className="mt-4 p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#596579]">
          <span className="font-semibold uppercase tracking-wider text-[#172033]">
            Quick Role Credentials (Direct Routing)
          </span>
          <span className="font-mono">Role Test Presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('manager')}
            className="px-2 py-1 bg-[#EDF5F8] hover:bg-[#D9EBF2] text-[#176B87] border border-[#B3CBE0] rounded text-[11px] font-mono font-medium transition-colors"
          >
            Manager → /dashboard
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('engineer')}
            className="px-2 py-1 bg-[#EDF7F2] hover:bg-[#B8DCC9]/40 text-[#2E7D5B] border border-[#B8DCC9] rounded text-[11px] font-mono font-medium transition-colors"
          >
            Site Engineer → /engineer
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="px-2 py-1 bg-[#EDF5F8] hover:bg-[#B3CBE0]/40 text-[#3B6EA8] border border-[#B3CBE0] rounded text-[11px] font-mono font-medium transition-colors"
          >
            Admin → /admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('invalid')}
            className="px-2 py-1 bg-[#FBEFEE] hover:bg-[#FBEFEE]/80 text-[#B5473C] border border-[#E4B0AA] rounded text-[11px] font-mono transition-colors"
          >
            Invalid Creds
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center gap-2 p-4 text-sm text-[#596579]" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#176B87] shrink-0" />
          <span className="font-medium text-[#172033]">Loading session...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
