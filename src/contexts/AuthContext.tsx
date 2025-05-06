
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Mock users for demonstration purposes
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "arimateia@farmacia.com",
    name: "Arimateia",
    role: "deliverer"
  },
  {
    id: "2",
    email: "ewerton@farmacia.com",
    name: "Ewerton",
    role: "deliverer"
  },
  {
    id: "3",
    email: "gerente@farmacia.com",
    name: "Gerente",
    role: "manager"
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function that would use Firebase Auth in a real implementation
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // In a real app, this would be a Firebase Auth call
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Store user in local storage
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // In a real app, this would be a Firebase Auth signOut call
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
