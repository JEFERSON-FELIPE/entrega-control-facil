
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { supabase } from "../integrations/supabase/client";
import { mapDbProfileToUser } from "../types/supabase-extended";

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

  // Check for stored user on initial load and Supabase session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for existing Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError || !profile) {
            console.error("Profile error:", profileError);
            setLoading(false);
            return;
          }
          
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name,
            role: profile.role as "deliverer" | "manager"
          };
          
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError || !profile) {
            console.error("Profile error:", profileError);
            return;
          }
          
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name,
            role: profile.role as "deliverer" | "manager"
          };
          
          setCurrentUser(user);
        } catch (error) {
          console.error("Profile fetch error:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Login function using Supabase Auth
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (!data.user) throw new Error("User not found");
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError || !profile) throw profileError || new Error("Profile not found");
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: profile.name,
        role: profile.role as "deliverer" | "manager"
      };
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("Login error:", error);
      
      // Fallback to mock users for testing
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser) {
        setCurrentUser(mockUser);
        return mockUser;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
