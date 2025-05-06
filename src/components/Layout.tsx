
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";
import { Toaster } from "../components/ui/toaster";
import { Loader } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: "deliverer" | "manager";
}

const Layout = ({ children, requireAuth = false, requiredRole }: LayoutProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authentication is required and user is not logged in, redirect to login
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific role is required, check user role
  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {currentUser && <Header />}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
