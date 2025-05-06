
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-pharmacy-primary">
            Farmácia Delivery Control
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {currentUser?.name} ({currentUser?.role === "manager" ? "Gerente" : "Entregador"})
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
