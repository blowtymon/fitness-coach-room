import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/services/authApi";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
      localStorage.setItem("fitness_token", response.data.token);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        updateUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
