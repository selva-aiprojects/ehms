"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_ROLE_MAP, ROLE_LABELS } from "@/lib/role-access";
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

const DEMO_SESSION_KEY = "ehms_demo_session";

function getDemoSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch { return null; }
}

function setDemoSession(profile: UserProfile) {
  try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile)); } catch {}
}

function clearDemoSession() {
  try { localStorage.removeItem(DEMO_SESSION_KEY); } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const supabase = createClient();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser?.email) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, avatar_url")
          .eq("email", authUser.email)
          .single<Record<string, unknown>>();

        if (profile) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role_id, roles(name)")
            .eq("user_id", (profile as { id: string }).id)
            .single<Record<string, unknown>>();

          const p = profile as { id: string; email: string; first_name: string; last_name: string | null; avatar_url: string | null };
          const role_name = (roleData as unknown as { roles: { name: string } })?.roles?.name || "unknown";
          const role_id = roleData?.role_id as string || "";
          const user = { id: p.id, email: p.email, first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url, role_name, role_id };
          setDemoSession(user);
          setState({ user, loading: false, error: null });
          return;
        }

        setState({
          user: {
            id: authUser.id, email: authUser.email,
            first_name: authUser.user_metadata?.first_name || authUser.email.split("@")[0] || "User",
            last_name: null, avatar_url: null, role_name: "unknown", role_id: "",
          },
          loading: false, error: null,
        });
        return;
      }

      const demo = getDemoSession();
      if (demo) {
        setState({ user: demo, loading: false, error: null });
        return;
      }

      setState({ user: null, loading: false, error: null });
    } catch {
      const demo = getDemoSession();
      if (demo) {
        setState({ user: demo, loading: false, error: null });
        return;
      }
      setState({ user: null, loading: false, error: "Failed to load profile" });
    }
  }, [supabase]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    clearDemoSession();
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

export function initDemoSession(email: string): UserProfile | null {
  const roleName = DEMO_ROLE_MAP[email];
  if (!roleName) return null;
  const label = ROLE_LABELS[roleName] || roleName;
  const user: UserProfile = {
    id: email, email,
    first_name: label, last_name: null,
    avatar_url: null,
    role_name: roleName,
    role_id: roleName,
  };
  setDemoSession(user);
  return user;
}

export const useAuth = () => useContext(AuthContext);
