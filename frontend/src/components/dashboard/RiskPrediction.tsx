"use client";

import { AlertTriangle, TrendingUp, Zap, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ... (El bloque de MOCK_DATA / IARiskData déjalo igual, o cópialo del anterior si quieres) ...
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

export default function RiskPrediction() {
    return (
        <Card className="shadow-2xl border-2 border-dashed border-[#0C2D57] bg-[#F7F9FF]">
            {/* ✅ Header adaptable: En móvil es columna, en PC es fila */}
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-red-700 flex items-center gap-2 md:gap-3">
                    <Zap className="h-5 w-5 md:h-6 md:w-6 text-red-700 fill-red-200 shrink-0" />
                    <span>Análisis Predictivo (IA)</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-[#0C2D57] text-white self-start md:self-auto text-xs md:text-sm">
                    Motor Predictivo v1.0
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6">
                <p className="text-xs md:text-sm text-gray-600 border-b pb-3">
                    Este motor analiza el historial de OTs fallidas y la complejidad de la obra para predecir fallos de calidad.
                </p>

                {IARiskData.filter(d => d.probabilidadFallo > 50).map((data, index) => (
                    <div key={index} className="border border-red-200 p-3 md:p-4 rounded-lg bg-white shadow-md">
                        {/* ✅ Fila de título adaptable */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-1 md:gap-0">
                            <span className="font-semibold text-base md:text-lg text-[#0C2D57] break-words">{data.obra}</span>
                            <Badge className="text-xs md:text-md whitespace-nowrap" variant={data.probabilidadFallo > 70 ? 'destructive' : 'default'}>
                                Riesgo: {data.probabilidadFallo}%
                            </Badge>
                        </div>
                        
                        <p className="text-xs md:text-sm text-gray-800 mb-2">
                            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 inline mr-1 text-red-500 shrink-0" />
                            <span className="font-semibold">Motivo:</span> {data.motivoIA}
                        </p>

                        <p className="text-xs md:text-sm font-semibold text-green-700">
                            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 inline mr-1 shrink-0" />
                            <span>Acción: {data.accionRecomendada}</span>
                        </p>
                        <div className="mt-2">
                            <Badge variant="outline" className="text-[10px] md:text-xs">
                                Trabajo: {data.tipoTrabajo}
                            </Badge>
                        </div>
                    </div>
                ))}
                
                {IARiskData.filter(d => d.probabilidadFallo <= 50).length === IARiskData.length && (
                    <div className="text-center text-green-600 font-medium py-4 text-sm">
                        <CheckCircle className="h-5 w-5 inline mr-2" />
                        No se detectaron riesgos altos.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}