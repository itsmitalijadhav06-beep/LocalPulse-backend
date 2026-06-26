import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

export const mapBackendUserToFrontend = (backendUser: any): User => {
  if (!backendUser) return null as any;
  return {
    id: String(backendUser.id),
    name: backendUser.full_name || backendUser.name || "User",
    email: backendUser.email,
    avatarUrl: backendUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendUser.email}`,
    city: backendUser.city || "Indore",
    contributionScore: backendUser.contributionScore ?? 0,
    reportsCount: backendUser.reportsCount ?? 0,
    upvotesGiven: backendUser.upvotesGiven ?? 0,
    role: backendUser.role,
  };
};

interface AppContextValue {
  user: User | null;
  setUser: (u: any) => void;
  isLoadingUser: boolean;
  radiusKm: number;
  setRadiusKm: (n: number) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(3);

  const setUser = (u: any) => {
    if (u) {
      setUserState(mapBackendUserToFrontend(u));
    } else {
      setUserState(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lp_token") : null;
    if (!token) {
      setIsLoadingUser(false);
      return;
    }
    authService
      .me()
      .then((res) => setUser(res.data.data))
      .catch(() => {
        window.localStorage.removeItem("lp_token");
        setUser(null);
      })
      .finally(() => setIsLoadingUser(false));
  }, []);

  const logout = () => {
    window.localStorage.removeItem("lp_token");
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, setUser, isLoadingUser, radiusKm, setRadiusKm, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}