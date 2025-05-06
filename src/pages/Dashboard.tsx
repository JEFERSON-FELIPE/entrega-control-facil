
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DeliverySummary } from "../types";
import { getMonthlySummary } from "../services/deliveryService";
import { format, addMonths, setDate } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartTooltipContent } from "../components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const Dashboard = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<DeliverySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Calculate the period from 26th of previous month to 25th of current month
  const getPeriodDates = (selectedMonth: number, selectedYear: number) => {
    // For the start date: 26th of previous month
    const startMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const startYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const startDate = new Date(startYear, startMonth - 1, 26);
    
    // For the end date: 25th of current month
    const endDate = new Date(selectedYear, selectedMonth - 1, 25);
    
    return { startDate, endDate };
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getPeriodDates(month, year);
        const data = await getMonthlySummary(month, year);
        setSummary(data);
      } catch (error) {
        console.error("Error fetching summary data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [month, year]);

  // Generate month options
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" }
  ];

  // Generate year options (current year and 2 years before)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  // Prepare data for the chart
  const getChartData = (delivererSummary: DeliverySummary) => {
    return delivererSummary.deliveriesByType
      .filter(type => !type.typeName.includes("Extra"))
      .map(type => ({
        name: type.typeName,
        quantidade: type.quantity,
        value: type.value
      }));
  };

  // Get period label
  const getPeriodLabel = () => {
    const { startDate, endDate } = getPeriodDates(month, year);
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-pharmacy-primary">Relatório Mensal</h1>
        <p className="text-muted-foreground">
          Visualize o relatório de entregas por entregador
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Mês</h2>
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Ano</h2>
          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <div className="rounded-md border border-dashed p-3 text-center">
            <h3 className="font-medium">Período:</h3>
            <p>{getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="text-pharmacy-primary">Carregando dados...</div>
        </div>
      ) : summary.length > 0 ? (
        <Tabs defaultValue={summary[0].delivererId}>
          <TabsList className="mb-4 w-full bg-muted">
            {summary.map((item) => (
              <TabsTrigger
                key={item.delivererId}
                value={item.delivererId}
                className="flex-1"
              >
                {item.delivererName}
              </TabsTrigger>
            ))}
          </TabsList>

          {summary.map((item) => (
            <TabsContent key={item.delivererId} value={item.delivererId}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo - {item.delivererName}</CardTitle>
                    <CardDescription>
                      {months.find((m) => m.value === month)?.label} de {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-medium">Total de Entregas:</span>
                        <span>{item.totalDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-medium">Entregas Extras:</span>
                        <span>{item.totalExtras}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes por Tipo</CardTitle>
                    <CardDescription>
                      Quantidade de entregas por categoria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {item.deliveriesByType
                        .filter((type) => !type.typeName.includes("Extra"))
                        .map((type) => (
                          <div
                            key={type.typeId}
                            className="flex items-center justify-between border-b pb-2"
                          >
                            <span className="font-medium">
                              {type.typeName} (R$ {type.value.toFixed(2)}):
                            </span>
                            <span>{type.quantity}</span>
                          </div>
                        ))}
                      {item.totalExtras > 0 && (
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-medium">Extras:</span>
                          <span>{item.totalExtras}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart Section */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Gráfico de Entregas</CardTitle>
                  <CardDescription>
                    Visualização das entregas por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer 
                    config={{
                      "R$3,70": { color: "#10b981" },
                      "R$5,00": { color: "#3b82f6" },
                      "R$7,40": { color: "#8b5cf6" },
                      "Extra": { color: "#f43f5e" }
                    }}
                  >
                    <BarChart data={getChartData(item)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip 
                        content={({active, payload}) => (
                          active && payload && payload.length ? (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="font-medium">{payload[0].payload.name}</div>
                              <div className="text-xs">Quantidade: {payload[0].payload.quantidade}</div>
                              <div className="text-xs">Valor: R$ {payload[0].payload.value.toFixed(2)}</div>
                            </div>
                          ) : null
                        )}
                      />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
