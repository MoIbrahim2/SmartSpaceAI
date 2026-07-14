import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { signin as signinApi, signup as signupApi, logout as logoutApi, getProfile, API_HOST } from "../api";

const AuthContext = createContext(null);

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    firstName: userData.profile?.firstName || userData.firstName || "",
    lastName: userData.profile?.lastName || userData.lastName || "",
    dateOfBirth: userData.profile?.dateOfBirth || userData.dateOfBirth || "",
    email: userData.authentication?.email || userData.email || "",
    profileImage: userData.profile?.avatar
      ? (userData.profile.avatar.startsWith("http") ? userData.profile.avatar : `${API_HOST}/${userData.profile.avatar}`)
      : userData.profileImage || "",
  };
};

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((val) => {
    setUserState((prev) => {
      const nextUser = typeof val === "function" ? val(prev) : val;
      const normalized = normalizeUser(nextUser);
      if (normalized) {
        localStorage.setItem("user", JSON.stringify(normalized));
      } else {
        localStorage.removeItem("user");
      }
      return normalized;
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const syncProfile = async () => {
        try {
          const { data } = await getProfile();
          if (data.success && data.data) {
            const updatedUser = data.data.user || data.data;
            setUser(updatedUser);
          }
        } catch (err) {
          console.error("Profile sync failed:", err);
        } finally {
          setLoading(false);
        }
      };
      syncProfile();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [setUser]);

  const signin = useCallback(async (email, password) => {
    const { data } = await signinApi(email, password);
    if (data.success && data.data) {
      const { accessToken, user: userData } = data.data;
      localStorage.setItem("accessToken", accessToken);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      return data.data;
    }
    throw new Error(data.message || "Login failed");
  }, []);

  const signup = useCallback(async (formData) => {
    const { data } = await signupApi(formData);
    if (data.success && data.data) {
      const { accessToken, user: userData } = data.data;
      localStorage.setItem("accessToken", accessToken);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      return data.data;
    }
    throw new Error(data.message || "Registration failed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
