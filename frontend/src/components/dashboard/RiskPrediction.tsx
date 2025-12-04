// frontend/src/components/dashboard/RiskPrediction.tsx

"use client";

// ✅ CORRECCIÓN: Se agregó 'CheckCircle' a los imports
import { AlertTriangle, TrendingUp, Zap, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- DATOS SIMULADOS GENERADOS POR "IA" ---
// Estos datos simulan un modelo que analiza la Obra, el Tipo de Trabajo y el historial de NO CUMPLE.

const IARiskData = [
    {
        obra: "TD-2029 (Torre Digital)",
        tipoTrabajo: "VIGA DE CIMENTACIÓN",
        probabilidadFallo: 78,
        motivoIA: "Alta tasa de 'NO CUMPLE' en la fase de ARMADO_EN_OBRA en las últimas 3 semanas.",
        accionRecomendada: "ASIGNAR SUPERVISOR EXPERTO (Javier) para una doble validación de Caisson/Viga en la próxima OT.",
    },
    {
        obra: "RSL-2027 (Remodelación Sede)",
        tipoTrabajo: "TRAZADO DE EJES ESTRUCTURALES",
        probabilidadFallo: 55,
        motivoIA: "Patrón de errores en 'Trazado' en obras del mismo tipo de estructura. Riesgo de desviación dimensional.",
        accionRecomendada: "REVISAR PROTOCOLO de medición antes de iniciar la OT #292.",
    },
    {
        obra: "EET-2029 (Estación de Aguas)",
        tipoTrabajo: "EXCAVACIÓN Y ACERO",
        probabilidadFallo: 15,
        motivoIA: "Rendimiento estable y alta tasa de 'CUMPLE'. Riesgo bajo.",
        accionRecomendada: "Sin acción. Monitoreo estándar.",
    },
];

// ---------------------------------------------------------------------
// COMPONENTE DE PREDICCIÓN
// ---------------------------------------------------------------------

export default function RiskPrediction() {
    return (
        <Card className="shadow-2xl border-2 border-dashed border-[#0C2D57] bg-[#F7F9FF]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold text-red-700 flex items-center gap-3">
                    <Zap className="h-6 w-6 text-red-700 fill-red-200" />
                    Análisis Predictivo de Riesgos (Simulación IA)
                </CardTitle>
                <Badge variant="secondary" className="bg-[#0C2D57] text-white">
                    Motor Predictivo v1.0
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-gray-600 border-b pb-3">
                    Este motor analiza el historial de OTs fallidas, la complejidad de la obra y el tipo de trabajo para predecir dónde ocurrirán los próximos fallos de calidad **antes** de que sucedan.
                </p>

                {IARiskData.filter(d => d.probabilidadFallo > 50).map((data, index) => (
                    <div key={index} className="border border-red-200 p-4 rounded-lg bg-white shadow-md">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-lg text-[#0C2D57]">{data.obra}</span>
                            <Badge className="text-md" variant={data.probabilidadFallo > 70 ? 'destructive' : 'default'}>
                                Riesgo: {data.probabilidadFallo}%
                            </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-2">
                            <AlertTriangle className="h-4 w-4 inline mr-1 text-red-500" />
                            **Motivo Predictivo:** {data.motivoIA}
                        </p>

                        <p className="text-sm font-semibold text-green-700">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            **Acción Prioritaria:** {data.accionRecomendada}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                             Trabajo Analizado: {data.tipoTrabajo}
                        </Badge>
                    </div>
                ))}
                
                {/* Ahora CheckCircle ya está importado y no dará error */}
                {IARiskData.filter(d => d.probabilidadFallo <= 50).length === IARiskData.length && (
                    <div className="text-center text-green-600 font-medium py-4">
                        <CheckCircle className="h-5 w-5 inline mr-2" />
                        No se detectaron riesgos de alta probabilidad en este momento.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}