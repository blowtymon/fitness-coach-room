import { useState, useEffect } from "react";
import { authApi } from "@/services/authApi";

export interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("fitness_user");
    const storedToken = localStorage.getItem("fitness_token");

    if (storedUser && storedToken) {
      try {
        const tokenData = parseJwt(storedToken);

        if (tokenData?.exp && Date.now() / 1000 > tokenData.exp) {
          signOut();
        } else {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.warn("Token parse failed", err);
        signOut();
      }
    }

    setLoading(false);
  }, []);

  const parseJwt = (token: string): { exp: number } | null => {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  };

  const signOut = async () => {
    await authApi.signout();
    localStorage.removeItem("fitness_user");
    localStorage.removeItem("fitness_token");
    setUser(null);
    setToken(null);
  };

  const signIn = async (email: string, password: string) => {
    const response = await authApi.signin({ email, password });

    if (response.success && response.data) {
      setUser(response.data.user);
      setToken(response.data.token);

      localStorage.setItem("fitness_user", JSON.stringify(response.data.user));
      localStorage.setItem(
        "fitness_token",
        JSON.stringify(response.data.token)
      );
    }

    return response;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const response = await authApi.signup({ email, password, name });

    if (response.success && response.data) {
      setUser(response.data.user);
      localStorage.setItem("fitness_user", JSON.stringify(response.data.user));
    }

    return response;
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("fitness_user", JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    token,
    loading,
    signOut,
    signIn,
    signUp,
    updateUser,
    setUser,
  };
}
