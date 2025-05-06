
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const user = await login(email, password);
      
      // Redirect based on user role
      if (user.role === "manager") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name}!`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha no login",
        description: "Email ou senha incorretos"
      });
      console.error("Login error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-pharmacy-primary">
            Sistema de Controle de Entregas
          </CardTitle>
          <CardDescription>
            Farmácia | Entre com suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Use: arimateia@farmacia.com, ewerton@farmacia.com ou gerente@farmacia.com
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Use qualquer senha para este demo
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-pharmacy-primary hover:bg-pharmacy-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
