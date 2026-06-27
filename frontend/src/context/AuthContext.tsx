"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TRAINER" | "MEMBER";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("corefit_token");
    const storedUser = localStorage.getItem("corefit_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem("corefit_token");
        localStorage.removeItem("corefit_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      // Persist session
      localStorage.setItem("corefit_token", newToken);
      localStorage.setItem("corefit_user", JSON.stringify(newUser));

      // Set axios default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(newUser);

      // Redirect based on role
      const rolePaths: Record<string, string> = {
        SUPER_ADMIN: "/admin",
        ADMIN: "/admin",
        TRAINER: "/trainer",
        MEMBER: "/member",
      };
      router.push(rolePaths[newUser.role] || "/");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("corefit_token");
    localStorage.removeItem("corefit_user");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
