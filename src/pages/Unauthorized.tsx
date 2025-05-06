
import React from "react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-pharmacy-primary">Acesso negado</h1>
        <p className="max-w-md text-muted-foreground">
          Você não tem permissão para acessar esta página. Por favor, volte para a página principal ou entre em contato com o administrador.
        </p>
        <div className="pt-4">
          <Button
            onClick={() => navigate("/")}
            variant="default"
            className="bg-pharmacy-primary hover:bg-pharmacy-dark"
          >
            Voltar para a página inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
