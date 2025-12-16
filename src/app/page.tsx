'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input } from '@/components/ui';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-lg text-muted-foreground">Loading...</span>
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
      <Card className="w-full max-w-md bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back — let’s jump in.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="flex items-center">
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account? <br />
              <span className="text-foreground font-medium">Contact an admin for access.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
