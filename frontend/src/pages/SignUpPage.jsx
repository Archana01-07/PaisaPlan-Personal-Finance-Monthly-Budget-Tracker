import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await register(name.trim(), email.trim(), password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setGeneralError(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setFormErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">PaisaPlan</span>
        </div>
        <h2 className="text-center text-xl font-bold text-slate-900">
          Create your personal finance account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Track expenses, plan monthly budgets, and monitor your savings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {generalError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sriman Rao"
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                  formErrors.name
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-teal-500'
                }`}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                  formErrors.email
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-teal-500'
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password <span className="text-rose-500">* (at least 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full pl-3.5 pr-10 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                    formErrors.password
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-3.5 pr-10 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                    formErrors.confirmPassword
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
