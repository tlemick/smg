'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, isLoading: userLoading } = useUser();
  const router = useRouter();

  // Redirect authenticated users to onboarding or dashboard
  useEffect(() => {
    if (!userLoading && user) {
      // Check if user has completed onboarding
      if (user.hasCompletedOnboarding === false) {
        router.push('/onboarding/welcome');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      // Redirect will be handled by useEffect based on onboarding status
      // No need to explicitly redirect here
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-lg text-neutral-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 gap-6"
      style={{ backgroundImage: 'url(/hero_bg.webp)' }}
    >
      {/* Title */}
      <h1 className="text-6xl font-bold text-white text-center drop-shadow-lg">
        The Stock <br /> Market Game
      </h1>

      {/* Login Modal */}
      <div className="bg-neutral-900/95 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-neutral-100">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-200 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border text-white border-neutral-600 rounded-md shadow-sm placeholder-neutral-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 "
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-200 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-600 rounded-md shadow-sm placeholder-neutral-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-white"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 mt-12 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        

        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '} <br />
            <span className="text-emerald-600 font-medium cursor-pointer hover:text-emerald-700">
              Contact admin for access
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
