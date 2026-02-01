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
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
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
          <img
            src="/src/assets/images/register-illustration.png"
            alt="Join Community"
            className="max-w-full h-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;

