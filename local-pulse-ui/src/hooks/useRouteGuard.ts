import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/contexts/AppContext";

export function useRouteGuard(allowedRoles: ("citizen" | "admin" | "provider" | "authority")[]) {
  const { user, isLoadingUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingUser) return;

    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    const userRole = user.role || "citizen";
    if (!allowedRoles.includes(userRole)) {
      if (userRole === "admin") {
        // Admin can access everything, should not be blocked but if route specifies otherwise
        return;
      }
      
      if (userRole === "provider") {
        navigate({ to: "/providers" });
      } else if (userRole === "authority") {
        navigate({ to: "/profile" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, isLoadingUser, navigate, allowedRoles]);

  const userRole = user?.role || "citizen";
  const hasAccess = user && (allowedRoles.includes(userRole) || userRole === "admin");

  return { 
    isLoading: isLoadingUser || !user || !hasAccess, 
    user 
  };
}
