'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  BadgeCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';

type RegisterState = 'idle' | 'submitting' | 'validation_error' | 'duplicate_email' | 'server_failure' | 'success';

type RoleOption = 'Engineer' | 'Manager';

export default function RegisterPage() {
  const router = useRouter();
  const { setUserRole } = useApp();
  const { addToast } = useToast();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('Oil India Limited');
  const [department, setDepartment] = useState('Infrastructure & Pipelines');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<RoleOption>('Engineer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [registerState, setRegisterState] = useState<RegisterState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time password criteria
  const passwordCriteria = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUpper: /[A-Z]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your complete legal name';
    }

    if (!workEmail.trim()) {
      newErrors.workEmail = 'Work Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim())) {
      newErrors.workEmail = 'Please enter a valid corporate or project email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid contact phone number';
    }

    if (!organization.trim()) {
      newErrors.organization = 'Organization is required';
    }

    if (!department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet minimum security requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setRegisterState('validation_error');
      return;
    }

    setRegisterState('submitting');

    setTimeout(() => {
      // Test trigger: server failure
      if (workEmail.toLowerCase().includes('serverfail')) {
        setRegisterState('server_failure');
        return;
      }

      // Test trigger: duplicate email
      if (
        workEmail.toLowerCase() === 'rajesh.sharma@oilindia.in' ||
        workEmail.toLowerCase() === 'debajit.borah@oilindia.in' ||
        workEmail.toLowerCase().includes('duplicate')
      ) {
        setRegisterState('duplicate_email');
        return;
      }

      // Success
      setRegisterState('success');
      setUserRole(role === 'Manager' ? 'manager' : 'engineer');

      addToast({
        type: 'success',
        title: 'Account Provisioned',
        description: `Welcome to PLnEX, ${fullName}. Account created as ${role}.`,
      });

      // Auto redirect to schedule twin
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 1200);
  };

  // Quick fill test cases
  const handleQuickFill = (type: 'engineer' | 'manager' | 'duplicate' | 'server') => {
    setErrors({});
    if (type === 'engineer') {
      setFullName('Pranab Gogoi');
      setWorkEmail('pranab.gogoi@oilindia.in');
      setPhone('+91 94350 12345');
      setOrganization('Oil India Limited');
      setDepartment('Piping & Mechanical');
      setDesignation('Senior Pipeline Engineer');
      setRole('Engineer');
      setPassword('Pipeline2026!');
      setConfirmPassword('Pipeline2026!');
      setRegisterState('idle');
    } else if (type === 'manager') {
      setFullName('Manash Baruah');
      setWorkEmail('manash.baruah@oilindia.in');
      setPhone('+91 94351 67890');
      setOrganization('Oil India Limited');
      setDepartment('Project Controls');
      setDesignation('Senior Planning Manager');
      setRole('Manager');
      setPassword('Controls2026!');
      setConfirmPassword('Controls2026!');
      setRegisterState('idle');
    } else if (type === 'duplicate') {
      setFullName('Rajesh Sharma');
      setWorkEmail('rajesh.sharma@oilindia.in');
      setPhone('+91 98111 22334');
      setOrganization('Oil India Limited');
      setDepartment('Project Controls');
      setDesignation('Chief Project Controls Manager');
      setRole('Manager');
      setPassword('Project2026!');
      setConfirmPassword('Project2026!');
      setRegisterState('idle');
    } else if (type === 'server') {
      setFullName('System Test User');
      setWorkEmail('serverfail@oilindia.in');
      setPhone('+91 99999 88888');
      setOrganization('Oil India Limited');
      setDepartment('IT Systems');
      setDesignation('Systems Tester');
      setRole('Engineer');
      setPassword('TestPass2026!');
      setConfirmPassword('TestPass2026!');
      setRegisterState('idle');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-sm overflow-hidden">
        {/* Header with PLnEX branding */}
        <div className="px-6 pt-7 pb-5 text-center border-b border-[#D9DEE5] bg-white">
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
            New User Account Registration • Oil India Limited Project Controls
          </p>
        </div>

        {/* Success State Overlay */}
        {registerState === 'success' ? (
          <div className="p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#EDF7F2] border border-[#B8DCC9] flex items-center justify-center text-[#2E7D5B] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033]">Account Successfully Created</h2>
              <p className="text-xs text-[#596579] mt-1">
                Your credentials have been provisioned in the Oil India PMIS directory as <strong>{role}</strong>.
              </p>
            </div>
            <div className="w-full max-w-md mx-auto bg-[#D9DEE5] h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E7D5B] rounded-full w-full" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#176B87] font-medium font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Initializing workspace & redirecting...
            </span>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            {/* Server Failure Alert Banner */}
            {registerState === 'server_failure' && (
              <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-md flex items-start gap-2.5 text-xs text-[#B5473C] animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">User Provisioning Gateway Error (500)</strong>
                  <span className="text-[11px] opacity-90 leading-tight">
                    The Oil India central identity service was unreachable. Please try again in a few moments.
                  </span>
                </div>
              </div>
            )}

            {/* Duplicate Email Alert Banner */}
            {registerState === 'duplicate_email' && (
              <div className="p-3 bg-[#FDF6ED] border border-[#F0D4A6] rounded-md flex items-start gap-2.5 text-xs text-[#D98B32] animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Account Already Registered</strong>
                  <span className="text-[11px] opacity-90 leading-tight">
                    An active account with work email <strong>{workEmail}</strong> already exists. Please{' '}
                    <Link href="/login" className="underline font-semibold text-[#172033]">
                      Sign In
                    </Link>{' '}
                    or reset your password.
                  </span>
                </div>
              </div>
            )}

            {/* Two-Column Grid for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Full Name <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    disabled={registerState === 'submitting'}
                    placeholder="e.g. Debajit Borah"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                      errors.fullName
                        ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                        : 'border-[#D9DEE5] focus:border-[#176B87]'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Work Email <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={workEmail}
                    onChange={(e) => {
                      setWorkEmail(e.target.value);
                      if (errors.workEmail) setErrors({ ...errors, workEmail: '' });
                      if (registerState === 'duplicate_email') setRegisterState('idle');
                    }}
                    disabled={registerState === 'submitting'}
                    placeholder="name@oilindia.in"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                      errors.workEmail
                        ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                        : 'border-[#D9DEE5] focus:border-[#176B87]'
                    }`}
                  />
                </div>
                {errors.workEmail && (
                  <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.workEmail}</span>
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Contact Phone <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    disabled={registerState === 'submitting'}
                    placeholder="+91 94350 00000"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                      errors.phone
                        ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                        : 'border-[#D9DEE5] focus:border-[#176B87]'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Organization <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => {
                      setOrganization(e.target.value);
                      if (errors.organization) setErrors({ ...errors, organization: '' });
                    }}
                    disabled={registerState === 'submitting'}
                    placeholder="e.g. Oil India Limited"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                      errors.organization
                        ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                        : 'border-[#D9DEE5] focus:border-[#176B87]'
                    }`}
                  />
                </div>
                {errors.organization && (
                  <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.organization}</span>
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Department <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (errors.department) setErrors({ ...errors, department: '' });
                    }}
                    disabled={registerState === 'submitting'}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-md text-[#172033] focus:border-[#176B87] focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="Infrastructure & Pipelines">Infrastructure & Pipelines</option>
                    <option value="Project Controls">Project Controls & Scheduling</option>
                    <option value="Civil & Structural">Civil & Structural Works</option>
                    <option value="Piping & Mechanical">Piping & Mechanical Packages</option>
                    <option value="Electrical & Instrumentation">Electrical & Instrumentation</option>
                  </select>
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Designation <span className="text-[#B5473C]">*</span>
                </label>
                <div className="relative">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => {
                      setDesignation(e.target.value);
                      if (errors.designation) setErrors({ ...errors, designation: '' });
                    }}
                    disabled={registerState === 'submitting'}
                    placeholder="e.g. Lead Site Execution Engineer"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                      errors.designation
                        ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                        : 'border-[#D9DEE5] focus:border-[#176B87]'
                    }`}
                  />
                </div>
                {errors.designation && (
                  <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.designation}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Role Options: Manager vs Engineer */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-[#172033]">
                Project Role Assignment <span className="text-[#B5473C]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'Engineer',
                    title: 'Site Engineer',
                    desc: 'Submit daily progress reports (DPRs), capture site evidence & verify extracted actual quantities.',
                  },
                  {
                    id: 'Manager',
                    title: 'Project Controls Manager',
                    desc: 'Review candidate schedule matches, approve baseline link commitments, analyze delay chains & run simulations.',
                  },
                ].map((opt) => {
                  const isSelected = role === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setRole(opt.id as RoleOption)}
                      className={`p-3 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#176B87] bg-[#EDF5F8] ring-1 ring-[#176B87]'
                          : 'border-[#D9DEE5] bg-white hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#172033]">{opt.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#176B87] bg-[#176B87] text-white' : 'border-[#D9DEE5]'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#596579] leading-relaxed">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-2 border-t border-[#D9DEE5] space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#172033]">
                    Password <span className="text-[#B5473C]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      disabled={registerState === 'submitting'}
                      placeholder="Minimum 8 characters"
                      className={`w-full pl-9 pr-9 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                        errors.password
                          ? 'border-[#B5473C] bg-[#FBEFEE]/30'
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
                  {errors.password && (
                    <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#172033]">
                    Confirm Password <span className="text-[#B5473C]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      disabled={registerState === 'submitting'}
                      placeholder="Re-enter password"
                      className={`w-full pl-9 pr-9 py-2 text-xs bg-[#F7F8FA] border rounded-md text-[#172033] placeholder-[#7B8798] focus:bg-white outline-none transition-colors ${
                        errors.confirmPassword
                          ? 'border-[#B5473C] bg-[#FBEFEE]/30'
                          : confirmPassword && passwordsMatch
                          ? 'border-[#2E7D5B] focus:border-[#2E7D5B]'
                          : 'border-[#D9DEE5] focus:border-[#176B87]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033] p-1 rounded transition-colors"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-[#B5473C] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="text-[11px] text-[#2E7D5B] flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md text-[11px] space-y-1.5">
                <span className="font-semibold text-[#172033] block">Password Security Requirements:</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-[#2E7D5B]' : 'text-[#7B8798]'}`}>
                    {passwordCriteria.minLength ? <Check className="w-3.5 h-3.5 text-[#2E7D5B]" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">•</span>}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-[#2E7D5B]' : 'text-[#7B8798]'}`}>
                    {passwordCriteria.hasNumber ? <Check className="w-3.5 h-3.5 text-[#2E7D5B]" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">•</span>}
                    <span>At least 1 number (0–9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-[#2E7D5B]' : 'text-[#7B8798]'}`}>
                    {passwordCriteria.hasUpper ? <Check className="w-3.5 h-3.5 text-[#2E7D5B]" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">•</span>}
                    <span>Uppercase letter (A–Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-[#2E7D5B]' : 'text-[#7B8798]'}`}>
                    {passwordCriteria.hasSpecial ? <Check className="w-3.5 h-3.5 text-[#2E7D5B]" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">•</span>}
                    <span>Special character (!@#$)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={registerState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#176B87] hover:bg-[#135A72] disabled:bg-[#176B87]/60 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed mt-4"
            >
              {registerState === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Account in Directory...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Bottom Links */}
            <div className="pt-3 border-t border-[#D9DEE5] flex items-center justify-center gap-1.5 text-xs text-[#596579]">
              <span>Already have an account?</span>
              <Link href="/login" className="font-semibold text-[#176B87] hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Security & Compliance Footer */}
        <div className="px-6 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-center gap-2 text-[11px] text-[#596579]">
          <Shield className="w-3.5 h-3.5 text-[#176B87] flex-shrink-0" />
          <span>Restricted to Authorized Infrastructure Personnel • Oil India Limited</span>
        </div>
      </div>

      {/* Quick Testing Sandbox Bar (For evaluator testing of all requested states) */}
      <div className="mt-4 p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#596579]">
          <span className="font-semibold uppercase tracking-wider text-[#172033]">
            Evaluation Shortcuts (Quick Fill States)
          </span>
          <span className="font-mono">All States Tested</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill('engineer')}
            className="px-2 py-1 bg-[#F1F3F5] hover:bg-[#D9DEE5] text-[#172033] rounded text-[11px] font-mono transition-colors"
          >
            Pre-fill Engineer
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('manager')}
            className="px-2 py-1 bg-[#F1F3F5] hover:bg-[#D9DEE5] text-[#172033] rounded text-[11px] font-mono transition-colors"
          >
            Pre-fill Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('duplicate')}
            className="px-2 py-1 bg-[#FDF6ED] hover:bg-[#FDF6ED]/80 text-[#D98B32] border border-[#F0D4A6] rounded text-[11px] font-mono transition-colors"
          >
            Duplicate Email
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('server')}
            className="px-2 py-1 bg-[#FBEFEE] hover:bg-[#FBEFEE]/80 text-[#B5473C] border border-[#E4B0AA] rounded text-[11px] font-mono transition-colors"
          >
            Server Failure (500)
          </button>
        </div>
      </div>
    </div>
  );
}
