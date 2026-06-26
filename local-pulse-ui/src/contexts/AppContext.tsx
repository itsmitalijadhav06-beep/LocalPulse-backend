import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

export const mapBackendUserToFrontend = (backendUser: any): User => {
  if (!backendUser) return null as any;
  return {
    id: String(backendUser.id),
    name: backendUser.full_name || backendUser.name || "User",
    email: backendUser.email,
    avatarUrl: backendUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendUser.email}`,
    city: backendUser.city || "",
    contributionScore: backendUser.contributionScore ?? 0,
    reportsCount: backendUser.reportsCount ?? 0,
    upvotesGiven: backendUser.upvotesGiven ?? 0,
    role: backendUser.role,
  };
};

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  isSet: boolean;
}

interface AppContextValue {
  user: User | null;
  setUser: (u: any) => void;
  isLoadingUser: boolean;
  radiusKm: number;
  setRadiusKm: (n: number) => void;
  logout: () => void;
  userLocation: UserLocation;
  setUserLocation: (loc: UserLocation) => void;
  detectLocation: () => Promise<void>;
  isDetectingLocation: boolean;
}

const DEFAULT_LOCATION: UserLocation = {
  latitude: 0,
  longitude: 0,
  city: "",
  isSet: false,
};

const AppContext = createContext<AppContextValue | null>(null);

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      "Unknown location"
    );
  } catch {
    return "Unknown location";
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [userLocation, setUserLocationState] = useState<UserLocation>(() => {
    try {
      const stored = localStorage.getItem("lp_location");
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_LOCATION;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const setUser = (u: any) => {
    if (u) {
      setUserState(mapBackendUserToFrontend(u));
    } else {
      setUserState(null);
    }
  };

  const setUserLocation = useCallback((loc: UserLocation) => {
    setUserLocationState(loc);
    localStorage.setItem("lp_location", JSON.stringify(loc));
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const city = await reverseGeocode(latitude, longitude);
          setUserLocation({ latitude, longitude, city, isSet: true });
          setIsDetectingLocation(false);
          resolve();
        },
        () => {
          setIsDetectingLocation(false);
          resolve();
        },
        { timeout: 10000 }
      );
    });
  }, [setUserLocation]);

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
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoadingUser,
        radiusKm,
        setRadiusKm,
        logout,
        userLocation,
        setUserLocation,
        detectLocation,
        isDetectingLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
