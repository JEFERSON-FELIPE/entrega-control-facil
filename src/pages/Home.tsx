
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { DeliveryType } from "../types";
import { getDeliveryTypes, addDeliveryEntry } from "../services/deliveryService";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash } from "lucide-react";
import { cn } from "../lib/utils";

const Home = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState<{
    [key: string]: number;
  }>({});
  const [extraDeliveries, setExtraDeliveries] = useState<
    { id: string; quantity: number; value: number }[]
  >([]);
  const [nextExtraId, setNextExtraId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch delivery types on component mount
  useEffect(() => {
    const fetchDeliveryTypes = async () => {
      try {
        const types = await getDeliveryTypes();
        setDeliveryTypes(types.filter(type => !type.isExtra));
        
        // Initialize form data
        const initialFormData: { [key: string]: number } = {};
        types.filter(type => !type.isExtra).forEach(type => {
          initialFormData[type.id] = 0;
        });
        setFormData(initialFormData);
      } catch (error) {
        console.error("Error fetching delivery types", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os tipos de entrega"
        });
      }
    };

    fetchDeliveryTypes();
  }, [toast]);

  const handleQuantityChange = (typeId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;
    
    setFormData(prev => ({
      ...prev,
      [typeId]: numValue
    }));
  };

  const handleExtraQuantityChange = (id: string, quantity: string) => {
    const numValue = parseInt(quantity) || 0;
    if (numValue < 0) return;
    
    setExtraDeliveries(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: numValue } : item))
    );
  };

  const handleExtraValueChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return;
    
    setExtraDeliveries(prev =>
      prev.map(item => (item.id === id ? { ...item, value: numValue } : item))
    );
  };

  const addExtraDelivery = () => {
    setExtraDeliveries(prev => [
      ...prev,
      { id: `extra-${nextExtraId}`, quantity: 1, value: 0 }
    ]);
    setNextExtraId(prev => prev + 1);
  };

  const removeExtraDelivery = (id: string) => {
    setExtraDeliveries(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para registrar entregas"
      });
      return;
    }

    // Check if there are any deliveries to submit
    const hasStandardDeliveries = Object.values(formData).some(val => val > 0);
    const hasExtraDeliveries = extraDeliveries.some(item => item.quantity > 0);
    
    if (!hasStandardDeliveries && !hasExtraDeliveries) {
      toast({
        variant: "destructive",
        title: "Nenhuma entrega",
        description: "Adicione pelo menos uma entrega para enviar"
      });
      return;
    }

    // Validate extra deliveries
    for (const extra of extraDeliveries) {
      if (extra.quantity > 0 && extra.value <= 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Informe um valor válido para entregas extras"
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Prepare deliveries data
      const deliveries = [
        ...Object.entries(formData)
          .filter(([_, quantity]) => quantity > 0)
          .map(([typeId, quantity]) => {
            const deliveryType = deliveryTypes.find(type => type.id === typeId);
            return {
              typeId,
              quantity,
              value: deliveryType?.value || 0
            };
          }),
        ...extraDeliveries
          .filter(extra => extra.quantity > 0)
          .map(extra => ({
            typeId: "4", // Extra delivery type ID
            quantity: extra.quantity,
            value: extra.value
          }))
      ];

      // Submit the entry
      await addDeliveryEntry({
        date: format(selectedDate, "yyyy-MM-dd"),
        userId: currentUser.id,
        deliveries
      });

      toast({
        title: "Entregas registradas",
        description: `Entregas registradas com sucesso para ${format(selectedDate, "dd/MM/yyyy")}`
      });

      // Reset form
      const resetFormData: { [key: string]: number } = {};
      deliveryTypes.forEach(type => {
        resetFormData[type.id] = 0;
      });
      setFormData(resetFormData);
      setExtraDeliveries([]);
      setSelectedDate(new Date());
    } catch (error) {
      console.error("Error submitting deliveries", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar as entregas"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl text-pharmacy-primary">
            Registro de Entregas
          </CardTitle>
          <CardDescription className="text-center">
            Olá {currentUser?.name}, registre suas entregas do dia
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Date selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Data da entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy")
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Standard delivery types */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Entregas padrão</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {deliveryTypes.map((type) => (
                  <div key={type.id} className="space-y-2">
                    <Label htmlFor={`quantity-${type.id}`}>
                      {type.name} (R$ {type.value.toFixed(2)})
                    </Label>
                    <Input
                      id={`quantity-${type.id}`}
                      type="number"
                      min="0"
                      value={formData[type.id] || 0}
                      onChange={(e) => handleQuantityChange(type.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Extra deliveries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Entregas extras</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addExtraDelivery}
                  className="h-8"
                >
                  Adicionar Extra
                </Button>
              </div>
              
              {extraDeliveries.length === 0 && (
                <div className="rounded-lg border border-dashed border-muted p-4 text-center text-muted-foreground">
                  Clique em "Adicionar Extra" para registrar entregas com valores personalizados
                </div>
              )}

              {extraDeliveries.map((extra) => (
                <div key={extra.id} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`extra-quantity-${extra.id}`}>Quantidade</Label>
                    <Input
                      id={`extra-quantity-${extra.id}`}
                      type="number"
                      min="1"
                      value={extra.quantity}
                      onChange={(e) => handleExtraQuantityChange(extra.id, e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`extra-value-${extra.id}`}>Valor (R$)</Label>
                    <Input
                      id={`extra-value-${extra.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={extra.value}
                      onChange={(e) => handleExtraValueChange(extra.id, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-10 p-0"
                    onClick={() => removeExtraDelivery(extra.id)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-pharmacy-primary hover:bg-pharmacy-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Registrar Entregas"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Home;
