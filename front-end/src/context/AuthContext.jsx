import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { signin as signinApi, signup as signupApi, logout as logoutApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

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
