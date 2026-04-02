import { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [role, setRole] = useState(() => localStorage.getItem("user_role") || "student");

  const loginUser = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    const { access_token, role: userRole } = res.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user_role", userRole);
    setToken(access_token);
    setRole(userRole);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setToken(null);
    setRole("student");
  }, []);

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider value={{ token, role, isAdmin, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
