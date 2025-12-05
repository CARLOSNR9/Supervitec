"use client";

import { AlertTriangle, Construction, ListChecks, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 🚀 NUEVO: Importamos el componente de predicción
import RiskPrediction from "@/components/dashboard/RiskPrediction";

// --- DATOS SIMULADOS ---
const MOCK_DATA = {
  totalObras: 5,
  obrasEnProgreso: 3,
  obrasFinalizadas: 1,
  totalOTs: 160,
  otCumplidas: 125,
  otNoCumplidas: 35,
  responsableData: [
    { nombre: "Javier", total: 45, riesgo: 12 },
    { nombre: "Carlos", total: 60, riesgo: 15 },
    { nombre: "Josué", total: 30, riesgo: 5 },
  ],
  bitacorasAbiertas: 8,
};

const calculateRiskPercentage = (risk: number, total: number) => {
  return ((risk / total) * 100).toFixed(1);
};

const riskLevel = MOCK_DATA.otNoCumplidas / MOCK_DATA.totalOTs;

export default function DashboardPage() {
  return (
    // ✅ CORRECCIÓN 1: padding responsivo (p-4 en móvil, p-8 en PC)
    <main className="p-4 md:p-8 space-y-6 md:space-y-8">
      
      {/* Título adaptable */}
      <h1 className="text-2xl md:text-4xl font-extrabold text-[#0C2D57] border-b pb-4">
        Dashboard de Gestión
      </h1>

      {/* 🚀 INTEGRACIÓN IA: Análisis Predictivo */}
      {/* El componente RiskPrediction ya debería ser responsivo si usaste flex-col internamente */}
      <RiskPrediction />

      {/* SECCIÓN 1: MÉTRICAS CLAVE Y RIESGO */}
      {/* ✅ CORRECCIÓN 2: Grid adaptable (1 col en móvil, 2 en tablet, 4 en PC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Tarjeta de Riesgo - Ocupa 2 espacios solo en pantallas grandes */}
        <Card
          className={`col-span-1 sm:col-span-2 shadow-xl border-l-8 ${
            riskLevel > 0.15 ? "border-red-600" : "border-green-600"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg md:text-xl font-medium text-[#0C2D57]">
              Nivel de Riesgo Operacional
            </CardTitle>
            <AlertTriangle
              className={`h-6 w-6 ${
                riskLevel > 0.15 ? "text-red-500" : "text-green-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">
              {calculateRiskPercentage(MOCK_DATA.otNoCumplidas, MOCK_DATA.totalOTs)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {MOCK_DATA.otNoCumplidas} de {MOCK_DATA.totalOTs} Órdenes de
              Trabajo con resultado "NO CUMPLE".
            </p>
          </CardContent>
        </Card>

        {/* OBRAS ACTIVAS */}
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base md:text-lg font-medium">Obras Activas</CardTitle>
            <Construction className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {MOCK_DATA.obrasEnProgreso} / {MOCK_DATA.totalObras}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total de proyectos en ejecución.
            </p>
          </CardContent>
        </Card>

        {/* BITÁCORAS ABIERTAS */}
        <Card className="shadow-lg border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base md:text-lg font-medium">Bitácoras Pendientes</CardTitle>
            <ListChecks className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{MOCK_DATA.bitacorasAbiertas}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registros que requieren seguimiento.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2: DESGLOSE DE OT Y RESPONSABLES */}
      {/* ✅ CORRECCIÓN 3: Grid de 1 columna en móvil, 2 en PC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Desglose de OT */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-[#0C2D57]">
              Desglose de Órdenes de Trabajo (OT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2 text-sm md:text-base">
              <span className="font-semibold">Estado de Verificación</span>
              <span className="font-semibold">Total</span>
            </div>
            <div className="flex justify-between items-center text-green-700 text-sm md:text-base">
              <span>OT Cumplidas (Revisión OK)</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                {MOCK_DATA.otCumplidas}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-red-700 text-sm md:text-base">
              <span>OT con Fallos (NO CUMPLE)</span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                {MOCK_DATA.otNoCumplidas}
              </Badge>
            </div>
            <div className="flex justify-between items-center border-t pt-2 font-bold text-gray-700 text-sm md:text-base">
              <span>Total de Revisiones</span>
              <span>{MOCK_DATA.totalOTs}</span>
            </div>
          </CardContent>
        </Card>

        {/* RENDIMIENTO POR RESPONSABLE */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-[#0C2D57]">
              OT Asignadas por Usuario
            </CardTitle>
            <p className="text-xs md:text-sm text-gray-500">
              Métricas de asignación y riesgo por responsable.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_DATA.responsableData.map((resp) => (
              <div
                key={resp.nombre}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-1 sm:gap-0"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm md:text-base">{resp.nombre}</span>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-bold text-sm md:text-base">{resp.total} OT Asignadas</div>
                  <span
                    className={`text-xs ${
                      resp.riesgo > 10 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {resp.riesgo} en Riesgo (
                    {calculateRiskPercentage(resp.riesgo, resp.total)}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <footer className="text-center pt-4 md:pt-8 text-gray-400 text-xs md:text-sm">
        Dashboard generado con datos en tiempo real (Simulados: 08/11/2025).
      </footer>
    </main>
  );
}