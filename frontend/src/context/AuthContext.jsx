import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  CONTRIBUTOR: "contributor",
  VIEWER: "viewer",
};

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_WRITE: "users.write",
  USERS_DELETE: "users.delete",
  ROLES_MANAGE: "roles.manage",
  TEAMS_READ: "teams.read",
  TEAMS_WRITE: "teams.write",
  TEAMS_DELETE: "teams.delete",
  ACHIEVEMENTS_READ: "achievements.read",
  ACHIEVEMENTS_WRITE: "achievements.write",
  ACHIEVEMENTS_DELETE: "achievements.delete",
  METADATA_READ: "metadata.read",
  METADATA_WRITE: "metadata.write",
  METADATA_DELETE: "metadata.delete",
  REPORTS_READ: "reports.read",
  REVIEWS_READ: "performance_reviews.read",
  REVIEWS_WRITE: "performance_reviews.write",
  REVIEWS_DELETE: "performance_reviews.delete",
  PLANS_READ: "development_plans.read",
  PLANS_WRITE: "development_plans.write",
  PLANS_DELETE: "development_plans.delete",
  SKILLS_READ: "competencies.read",
  SKILLS_WRITE: "competencies.write",
  SKILLS_DELETE: "competencies.delete",
  TRAINING_READ: "training_records.read",
  TRAINING_WRITE: "training_records.write",
  TRAINING_DELETE: "training_records.delete",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const session = await apiClient.bootstrapSession();
      if (session?.user) {
        setUser({
          ...session.user,
          // Map backend permissions to frontend constants
          permissions: session.user.permissions || []
        });
      }
    } catch (err) {
      console.warn("No active session found:", err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    setError("");
    const session = await apiClient.bootstrapSession(true, email, password);
    if (session?.user) {
      const userData = { ...session.user, permissions: session.user.permissions || [] };
      setUser(userData);
      return userData;
    }
    throw new Error("Login failed: Could not retrieve user data");
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setError("");
    // In a real scenario, call usersApi.create or a signup endpoint
    const response = await apiClient.post("users-service", "signup", { name, email, password });
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    apiClient.clearSession();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      return user.permissions?.includes(permission) || false;
    },
    [user]
  );

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      // Backend roles might be codes or object. Handle both.
      const userRole = typeof user.role === 'string' ? user.role : user.role?.code;
      return roles.includes(userRole);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        hasPermission,
        hasRole,
        isAuthenticated: !!user,
        refreshSession,
        PERMISSIONS,
        ROLES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
