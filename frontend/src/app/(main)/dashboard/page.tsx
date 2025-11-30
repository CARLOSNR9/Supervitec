"use client";

import { AlertTriangle, CheckCircle, Construction, ListChecks, Users } from "lucide-react";
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
    <main className="p-8 space-y-8">
      <h1 className="text-4xl font-extrabold text-[#0C2D57] border-b pb-4">
        Dashboard de Gestión de Construcción
      </h1>

      {/* 🚀 INTEGRACIÓN IA: Análisis Predictivo */}
      <RiskPrediction />

      {/* SECCIÓN 1: MÉTRICAS CLAVE Y RIESGO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`col-span-2 shadow-xl border-l-8 ${
            riskLevel > 0.15 ? "border-red-600" : "border-green-600"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium text-[#0C2D57]">
              Nivel de Riesgo Operacional
            </CardTitle>
            <AlertTriangle
              className={`h-6 w-6 ${
                riskLevel > 0.15 ? "text-red-500" : "text-green-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
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
            <CardTitle className="text-lg font-medium">Obras Activas</CardTitle>
            <Construction className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
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
            <CardTitle className="text-lg font-medium">Bitácoras Pendientes</CardTitle>
            <ListChecks className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{MOCK_DATA.bitacorasAbiertas}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registros de Bitácoras que requieren seguimiento.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2: DESGLOSE DE OT Y RESPONSABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-[#0C2D57]">
              Desglose de Órdenes de Trabajo (OT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold">Estado de Verificación</span>
              <span className="font-semibold">Total</span>
            </div>
            <div className="flex justify-between items-center text-green-700">
              <span>OT Cumplidas (Revisión OK)</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                {MOCK_DATA.otCumplidas}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-red-700">
              <span>OT con Fallos (NO CUMPLE)</span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                {MOCK_DATA.otNoCumplidas}
              </Badge>
            </div>
            <div className="flex justify-between items-center border-t pt-2 font-bold text-gray-700">
              <span>Total de Revisiones</span>
              <span>{MOCK_DATA.totalOTs}</span>
            </div>
          </CardContent>
        </Card>

        {/* RENDIMIENTO POR RESPONSABLE */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-[#0C2D57]">
              OT Asignadas por Usuario
            </CardTitle>
            <p className="text-sm text-gray-500">
              Métricas de asignación y riesgo por responsable.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_DATA.responsableData.map((resp) => (
              <div
                key={resp.nombre}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{resp.nombre}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{resp.total} OT Asignadas</div>
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

      <footer className="text-center pt-8 text-gray-400 text-sm">
        Dashboard generado con datos en tiempo real (Simulados: 08/11/2025).
      </footer>
    </main>
  );
}
