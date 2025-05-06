
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

const Index = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "manager") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-pharmacy-primary" />
    </div>
  );
};

export default Index;
