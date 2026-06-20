"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  role_name: string;
  role_id: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setState({ user: data.user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: "Failed to fetch session" });
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setState({ user: null, loading: false, error: null });
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refresh: fetchUser }}>
      {state.loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#64748B] text-sm font-medium">Loading workspace...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
