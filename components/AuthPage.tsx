import React, { useState } from 'react';
import { login, register } from '../services/authService';
import type { User } from '../types';
import SlyntosLogo from './icons/SlyntosLogo';
import Loader from './Loader';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (isRegisterMode) {
      if (!email || !username || !password || !confirmPassword) {
        setError('All fields are required');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
    } else {
      if (!username || !password) {
        setError('Username and password are required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const user = await register(email, username, password);
        onAuthSuccess(user);
      } else {
        const user = await login(username, password);
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Background gradient extends full screen */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black -z-10" />
      
      {/* Optional: Add subtle animated gradient overlay */}
      <div className="absolute inset-0 opacity-30 -z-5">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-purple-500/20 blur-[100px] rounded-full" />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-[380px] bg-gray-900/40 backdrop-blur-xl rounded-[2rem] p-8 border border-gray-800/50 shadow-2xl relative z-10 my-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
            <SlyntosLogo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">
            {isRegisterMode 
              ? 'Sign up to start using Slyntos AI' 
              : 'Sign in to continue to Slyntos AI'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-all"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-all"
              placeholder={isRegisterMode ? "Choose a username" : "Enter your username"}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-all"
              placeholder={isRegisterMode ? "Create a password" : "Enter your password"}
              disabled={isLoading}
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:border-gray-700 focus:outline-none transition-all"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5">
              <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader />
                <span className="text-sm">
                  {isRegisterMode ? 'Creating account...' : 'Signing in...'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold">{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 pt-6 border-t border-gray-800/50 text-center">
          <p className="text-sm text-gray-400">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 font-semibold text-white hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              {isRegisterMode ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        {/* Forgot password (login mode only) */}
        {!isRegisterMode && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              onClick={() => {/* Handle forgot password */}}
            >
              Forgot your password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;