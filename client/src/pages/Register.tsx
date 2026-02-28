import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <img src="/branding/icon1.webp" alt="Qualitivate" className="h-10 w-10 object-contain" />
              <h1 className="text-2xl font-bold text-text-primary">Qualitivate</h1>
            </div>
            <h2 className="text-3xl font-bold text-text-primary">Create an account</h2>
            <p className="mt-2 text-text-secondary">Start your quality journey today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="alert-error">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label-soft">First Name</label>
                <input
                  id="firstName" name="firstName" type="text" required
                  className="input-soft" placeholder="John"
                  value={formData.firstName} onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label-soft">Last Name</label>
                <input
                  id="lastName" name="lastName" type="text" required
                  className="input-soft" placeholder="Doe"
                  value={formData.lastName} onChange={handleChange}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="label-soft">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="input-soft" placeholder="you@company.com"
                value={formData.email} onChange={handleChange}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label-soft">Password</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
                className="input-soft" placeholder="••••••••"
                value={formData.password} onChange={handleChange}
              />
              <p className="mt-1 text-xs text-text-muted">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="label-soft">Confirm Password</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                className="input-soft" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-accent w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:block relative w-0 flex-1 bg-primary-50">
        <div className="absolute inset-0 flex items-center justify-center p-20">
          <div className="w-full max-w-lg aspect-square relative flex items-center justify-center">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-200/40 to-secondary-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>

            {/* Interactive Grid UI */}
            <div className="relative z-10 w-full bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-8 shadow-2xl space-y-6 transform hover:scale-[1.02] transition-transform duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded-md mb-2"></div>
                    <div className="h-3 w-24 bg-gray-100 rounded-md"></div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Joined</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-secondary-100 mb-3 group-hover:bg-secondary-200 transition-colors"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md"></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-accent-100 mb-3 group-hover:bg-accent-200 transition-colors"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md"></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 p-4 rounded-xl border border-primary-100/50">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-3 w-20 bg-primary-200 rounded-md"></div>
                  <span className="text-xs font-bold text-primary-600">100%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


