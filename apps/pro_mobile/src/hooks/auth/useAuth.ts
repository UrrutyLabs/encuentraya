import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@lib/supabase/client";
import { usePushToken } from "../shared/usePushToken";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register push token when session is available
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- unregisterToken reserved for future use
  const { unregisterToken: _unregisterToken } = usePushToken(
    session?.user?.id ?? null
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes (including email confirmation)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle email confirmation
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        // User confirmed email and signed in
        // Navigation will be handled by app/index.tsx based on role/profile
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        throw error;
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        throw error;
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);

      // TODO: Unregister push token on logout
      // For MVP, token stays active but should be unregistered later
      // const currentToken = await getExpoPushToken();
      // if (currentToken) {
      //   await unregisterToken(currentToken.token);
      // }

      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar sesión");
      throw err;
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
}
