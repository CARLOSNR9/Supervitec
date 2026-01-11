"use client";

import { useState, useEffect, useMemo } from "react";
import { apiGet } from "@/lib/api"; // Tu cliente API
import { Bitacora } from "../../types/bitacora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // Asumiendo que tienes uno o usa inputs fecha
import { pdf } from "@react-pdf/renderer";
import { BitacoraReportePDF } from "../../components/BitacoraPDF"; // El componente actualizado
import { toast } from "sonner";
import { FileDown, Filter, Search } from "lucide-react";

export default function InformesPage() {
  const [data, setData] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [filtroObra, setFiltroObra] = useState("todos");
  const [filtroResponsable, setFiltroResponsable] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  // const [dateRange, setDateRange] = useState... (puedes agregar rango de fechas)

  // --- LISTAS PARA LOS DROPDOWNS (Se llenan dinámicamente) ---
  const [obrasList, setObrasList] = useState<string[]>([]);
  const [respList, setRespList] = useState<string[]>([]);

  // 1. CARGAR DATOS CRUDOS
  useEffect(() => {
    const loadData = async () => {
      try {
        const res: Bitacora[] = await apiGet("/bitacoras"); // Traemos todo (o usa endpoint con filtros si hay muchos datos)
        setData(res);
        
        // Extraer listas únicas para los filtros
        const obras = Array.from(new Set(res.map(b => b.obra?.nombre).filter(Boolean)));
        const resps = Array.from(new Set(res.map(b => b.responsable?.nombreCompleto).filter(Boolean)));
        setObrasList(obras);
        setRespList(resps);
      } catch (e) {
        toast.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. EL CEREBRO: FILTRADO EN TIEMPO REAL
  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      // Filtro Obra
      if (filtroObra !== "todos" && item.obra?.nombre !== filtroObra) return false;
      // Filtro Responsable
      if (filtroResponsable !== "todos" && item.responsable?.nombreCompleto !== filtroResponsable) return false;
      // Filtro Estado
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      
      return true;
    });
  }, [data, filtroObra, filtroResponsable, filtroEstado]);

  // 3. GENERAR EL PDF MASIVO
  const handleDownloadReport = async () => {
    if (datosFiltrados.length === 0) {
      toast.warning("No hay datos para generar el reporte");
      return;
    }

    const toastId = toast.loading(`Generando reporte de ${datosFiltrados.length} bitácoras...`);
    try {
      // Pasamos el ARRAY COMPLETO filtrado al PDF
      const blob = await pdf(<BitacoraReportePDF data={datosFiltrados} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_Bitacoras_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("¡Reporte generado con éxito!");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0C2D57]">Centro de Informes</h1>
          <p className="text-gray-500">Construye tu reporte usando los filtros a continuación</p>
        </div>
        
        {/* BOTÓN MAGISTRAL DE DESCARGA */}
        <Button 
          size="lg" 
          onClick={handleDownloadReport}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
          disabled={datosFiltrados.length === 0}
        >
          <FileDown className="mr-2 h-5 w-5" />
          Descargar PDF ({datosFiltrados.length} Registros)
        </Button>
      </div>

      {/* ZONA DE FILTROS (EL CONSTRUCTOR) */}
      <Card className="border-t-4 border-t-[#0C2D57]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 text-[#0C2D57] font-semibold">
            <Filter className="h-5 w-5" /> Filtros de Reporte
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* FILTRO OBRA */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Obra</label>
              <Select value={filtroObra} onValueChange={setFiltroObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las obras</SelectItem>
                  {obrasList.map(obra => (
                    <SelectItem key={obra} value={obra}>{obra}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* FILTRO RESPONSABLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsable</label>
              <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los responsables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {respList.map(resp => (
                    <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* FILTRO ESTADO */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ABIERTA">Abiertas</SelectItem>
                  <SelectItem value="CERRADA">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* PREVISUALIZACIÓN (TABLA SIMPLIFICADA) */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Previsualización del Informe</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {datosFiltrados.length} Resultados encontrados
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Obra</th>
                <th className="px-6 py-3">Responsable</th>
                <th className="px-6 py-3">Variable</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((bit) => (
                  <tr key={bit.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">#{bit.id}</td>
                    <td className="px-6 py-4">{new Date(bit.fechaCreacion).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{bit.obra?.nombre}</td>
                    <td className="px-6 py-4">{bit.responsable?.nombreCompleto}</td>
                    <td className="px-6 py-4">{bit.variable?.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bit.estado === 'ABIERTA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {bit.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay datos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}