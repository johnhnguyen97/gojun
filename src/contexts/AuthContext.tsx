import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  linkGoogleAccount: () => Promise<{ error: Error | null }>;
  unlinkGoogleAccount: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasApiKey: boolean;
  checkApiKey: () => Promise<boolean>;
  hasGoogleLinked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  const checkApiKey = useCallback(async (): Promise<boolean> => {
    if (!session?.access_token) {
      setHasApiKey(false);
      return false;
    }

    try {
      const response = await fetch('/api/api-key', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      setHasApiKey(data.hasApiKey);
      return data.hasApiKey;
    } catch {
      setHasApiKey(false);
      return false;
    }
  }, [session?.access_token]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check API key when user changes
  useEffect(() => {
    if (user && session) {
      checkApiKey();
    } else {
      setHasApiKey(false);
    }
  }, [user, session, checkApiKey]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const linkGoogleAccount = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const unlinkGoogleAccount = async () => {
    // Find the Google identity
    const googleIdentity = user?.identities?.find(id => id.provider === 'google');
    if (!googleIdentity) {
      return { error: new Error('No Google account linked') };
    }

    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    return { error: error as Error | null };
  };

  // Check if Google is linked
  const hasGoogleLinked = user?.identities?.some(id => id.provider === 'google') ?? false;

  const signOut = async () => {
    await supabase.auth.signOut();
    setHasApiKey(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      linkGoogleAccount,
      unlinkGoogleAccount,
      signOut,
      hasApiKey,
      checkApiKey,
      hasGoogleLinked,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
