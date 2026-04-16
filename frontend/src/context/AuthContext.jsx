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

function resolvePrimaryRole(user) {
  const roleCodes = Array.isArray(user?.role_codes)
    ? user.role_codes
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (roleCodes.includes(ROLES.ADMIN)) return ROLES.ADMIN;
  if (roleCodes.includes(ROLES.MANAGER)) return ROLES.MANAGER;
  if (roleCodes.includes(ROLES.CONTRIBUTOR)) return ROLES.CONTRIBUTOR;
  if (roleCodes.includes(ROLES.VIEWER)) return ROLES.VIEWER;

  const systemRole = typeof user?.role === "string" ? user.role.trim().toLowerCase() : "";
  if (systemRole === "admin") return ROLES.ADMIN;
  if (systemRole === "manager") return ROLES.MANAGER;

  // Backend system role USER represents a standard employee; default to contributor.
  if (systemRole === "user") return ROLES.CONTRIBUTOR;

  return ROLES.VIEWER;
}

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
          role: resolvePrimaryRole(session.user),
          // Map backend permissions to frontend constants
          permissions: session.user.permissions || [],
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
    // Check for tokens in the hash (OAuth callback)
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token=") || hash.includes("error="))) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const error = params.get("error");

      if (error) {
        setError(decodeURIComponent(error));
        window.location.hash = "";
      } else if (accessToken) {
        apiClient.setSession({ access_token: accessToken, refresh_token: refreshToken });
        // Clean URL first
        window.history.replaceState(null, "", window.location.pathname);
        // Then refresh to get user profile
        refreshSession();
      }
    } else {
      refreshSession();
    }
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    setError("");
    const session = await apiClient.bootstrapSession(true, email, password);
    if (session?.user) {
      const userData = {
        ...session.user,
        role: resolvePrimaryRole(session.user),
        permissions: session.user.permissions || [],
      };
      setUser(userData);
      return userData;
    }
    throw new Error("Login failed: Could not retrieve user data");
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setError("");
    const response = await apiClient.post("auth-service", "signup", { 
      display_name: name, 
      email, 
      password 
    });
    if (response) {
      return login(email, password);
    }
    throw new Error("Signup failed");
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
      const userRole = String(user.role || "").trim().toLowerCase();
      return roles.map((r) => String(r || "").trim().toLowerCase()).includes(userRole);
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
        loginWithGoogle: async () => {
          setLoading(true);
          window.location.href = apiClient.getServiceUrl("auth-service", "google/login");
        },
        loginWithGitHub: async () => {
          setLoading(true);
          window.location.href = apiClient.getServiceUrl("auth-service", "github/login");
        },
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
