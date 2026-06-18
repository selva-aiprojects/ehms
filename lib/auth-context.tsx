"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        setState({ user: null, loading: false, error: null });
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, avatar_url")
        .eq("email", authUser.email)
        .single<Record<string, unknown>>();

      if (profile) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role_id, roles(name)")
          .eq("user_id", profile.id as string)
          .single<Record<string, unknown>>();

        const p = profile as { id: string; email: string; first_name: string; last_name: string | null; avatar_url: string | null };
        const role_name = (roleData as unknown as { roles: { name: string } })?.roles?.name || "unknown";
        const role_id = roleData?.role_id as string || "";
        setState({
          user: {
            id: p.id,
            email: p.email,
            first_name: p.first_name,
            last_name: p.last_name,
            avatar_url: p.avatar_url,
            role_name,
            role_id,
          },
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: {
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || authUser.email?.split("@")[0] || "User",
            last_name: null,
            avatar_url: null,
            role_name: "unknown",
            role_id: "",
          },
          loading: false,
          error: null,
        });
      }
    } catch {
      setState({ user: null, loading: false, error: "Failed to load profile" });
    }
  }, [supabase]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, loading: false, error: null });
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
