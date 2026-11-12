import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || '/dashboard';

  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [roleSelect, setRoleSelect] = useState<'employee' | 'manager' | 'finance' | 'admin'>('employee');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // RFC-compliant email format validation
  const isValidEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length > 254) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(trimmed);
  };

  // Corporate password strength validation
  const checkPasswordStrength = (pass: string) => {
    const errors: string[] = [];
    if (!pass || pass.trim().length === 0) {
      errors.push('Password cannot be empty or whitespace only.');
      return errors;
    }
    if (pass.length < 8) {
      errors.push('Minimum 8 characters');
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('At least one uppercase letter (A-Z)');
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('At least one lowercase letter (a-z)');
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('At least one numeric number (0-9)');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass)) {
      errors.push('At least one special character (e.g. !@#$%^&*)');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    // 1. Mandatory fields check
    if (!cleanEmail || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    // 2. Validate email format on frontend
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      setLoading(false);
      return;
    }

    if (isRegister) {
      // 3. Name validation for registration
      if (!cleanName) {
        setError('Full name is required for registration.');
        setLoading(false);
        return;
      }

      // 4. Password complexity validation for registration
      const passwordErrors = checkPasswordStrength(password);
      if (passwordErrors.length > 0) {
        setError(`Password requirements not met: ${passwordErrors.join(', ')}.`);
        setLoading(false);
        return;
      }

      // 5. Password confirmation check
      if (password !== confirmPassword) {
        setError('Password and Confirm Password must match.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegister) {
        await register(cleanName, cleanEmail, password, roleSelect, department);
        // Switch to sign-in form with email pre-filled; user explicitly enters password to sign in
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('Account created successfully! Please enter your password to sign in.');
      } else {
        await login(cleanEmail, password);
        navigate(redirectTo);
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Authentication failed. Please check your network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#F3F6FA] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#101828] p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-white">
                SpendWise <span className="text-emerald-400 font-bold text-sm px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">AI</span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Spend Smarter. Stay Compliant. Reimburse Faster.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Autonomous receipt OCR, neural anomaly detection, real-time corporate policy checks, and automated reimbursement workflows for modern enterprises.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 97% OCR Accuracy
              </div>
              <p className="text-slate-400 text-[11px]">Instant vendor, total, tax, and itemized extraction.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Policy Verification
              </div>
              <p className="text-slate-400 text-[11px]">Enforce travel allowances and block non-compliant claims.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 SpendWise AI Platform. Enterprise Edition.
        </div>
      </div>

      {/* Right Login / Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isRegister ? 'Create Your Account' : 'Sign in to SpendWise AI'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRegister
                ? 'Register with your corporate email and a secure password'
                : 'Enter your registered email and password to access your dashboard'}
            </p>
          </div>

          {successMessage && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Product">Product</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                    <select
                      value={roleSelect}
                      onChange={(e) => setRoleSelect(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="finance">Finance</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Corporate Email Address *
              </label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isRegister && (
                <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Password requirements:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
                    <span className={password.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                      • At least 8 characters
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                      • Uppercase letter [A-Z]
                    </span>
                    <span className={/[a-z]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                      • Lowercase letter [a-z]
                    </span>
                    <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                      • Number [0-9]
                    </span>
                    <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                      • Special character (!@#$)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isRegister && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password *
                </label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (isRegister ? 'Creating Account...' : 'Authenticating...') : isRegister ? 'Create Account' : 'Sign in to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Need a new account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
