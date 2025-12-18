// frontend/src/routes/Auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, X, ArrowRight } from 'lucide-react';
import { getMyProfile } from '../../services/userService';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { login, signup, resetPasswordRequest, user, userProfile, profileLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in - use useEffect to prevent rendering login form
  useEffect(() => {
    if (user && !profileLoading) {
      console.log('User already logged in, redirecting...', { hasProfile: !!userProfile });
      if (userProfile) {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, userProfile, profileLoading, navigate]);

  // Don't render login form if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      navigate('/teacher/dashboard', { replace: true });
      if (isSigningUp) {
        await signup(email, password);
        setSignupSuccess(true);
        setEmail('');
        setPassword('');
        setTimeout(() => {
          setSignupSuccess(false);
          setIsSigningUp(false);
        }, 5000);
      } else {
        await login(email, password);
        console.log('Login successful, checking profile...');
        
        // Wait a moment for auth state to update and profile to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const profile = await getMyProfile();
          console.log('Profile exists:', profile);
          //navigate('/teacher/dashboard', { replace: true });
        } catch (profileError) {
          console.log('Profile error:', profileError);
          if (profileError.response?.status === 404) {
            console.log('No profile found, redirecting to complete-profile');
            navigate('/complete-profile', { replace: true });
          } else {
            console.error('Error fetching profile:', profileError);
            navigate('/', { replace: true });
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred.';
      
      if (err.message) {
        const msg = err.message.toLowerCase();
        
        if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
          errorMessage = '❌ Invalid email or password. Please check your credentials and try again.';
        } else if (msg.includes('email not confirmed')) {
          errorMessage = '📧 Please verify your email address. Check your inbox for the confirmation link.';
        } else if (msg.includes('user not found')) {
          errorMessage = '❌ No account found with this email address. Please sign up first.';
        } else if (msg.includes('too many requests')) {
          errorMessage = '⏳ Too many login attempts. Please wait a few minutes and try again.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = '🌐 Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);

    try {
      await resetPasswordRequest(resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSigningUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isSigningUp ? 'Sign up as a teacher to get started' : 'Sign in to continue to your account'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => {
                setIsSigningUp(false);
                setError(null);
                setSignupSuccess(false);
              }}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                !isSigningUp
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSigningUp(true);
                setError(null);
                setSignupSuccess(false);
              }}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                isSigningUp
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-400 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {signupSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-400 rounded-lg">
              <p className="font-semibold text-green-900 mb-1">✓ Signup successful!</p>
              <p className="text-sm text-green-800">
                Check your email <strong>{email}</strong> for confirmation. You've been registered as a Teacher.
              </p>
              <p className="text-xs text-green-700 mt-2">
                Tip: Check your spam folder if you don't see the email.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            {!isSigningUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isSigningUp ? (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Sign up as Teacher</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>Sign in</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 border border-gray-200 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowForgotPasswordModal(false);
                setResetEmail('');
                setResetError(null);
                setResetSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h3>
              <p className="text-gray-600 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetError && (
                <div className="p-4 bg-red-50 border border-red-400 rounded-lg">
                  <p className="text-red-700 text-sm">{resetError}</p>
                </div>
              )}

              {resetSuccess && (
                <div className="p-4 bg-green-50 border border-green-400 rounded-lg">
                  <p className="text-green-700 text-sm">
                    ✓ Password reset email sent! Check your inbox at <strong>{resetEmail}</strong>
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={resetSuccess}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetEmail('');
                    setResetError(null);
                    setResetSuccess(false);
                  }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || resetSuccess}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;