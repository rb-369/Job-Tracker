'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setError('Check your email for the confirmation link! (Or if auto-confirm is enabled in Supabase, you can log in now)');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none bg-white dark:bg-zinc-900 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-none ring-1 ring-black/[0.02] dark:ring-white/[0.02] rounded-[2rem]">
      <CardHeader className="p-8 pb-6">
        <CardTitle className="text-xl font-black uppercase tracking-widest text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${error.includes('Check your email') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
            <Input 
              type="email"
              required
              placeholder="you@example.com"
              className="h-14 bg-zinc-50 dark:bg-zinc-950 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all font-medium px-6"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
            <Input 
              type="password"
              required
              placeholder="••••••••"
              className="h-14 bg-zinc-50 dark:bg-zinc-950 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all font-medium px-6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-xs mt-6" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isSignUp ? 'Sign Up' : 'Log In'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="ml-2 font-bold text-primary hover:underline"
              disabled={loading}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
