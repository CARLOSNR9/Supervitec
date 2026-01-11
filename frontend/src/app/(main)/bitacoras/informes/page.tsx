"use client";

import { useState, useEffect, useMemo } from "react";
import { apiGet } from "@/lib/api"; 
import { Bitacora } from "../types/bitacora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { pdf } from "@react-pdf/renderer";
import { BitacoraReportePDF } from "../components/BitacoraPDF";
import { toast } from "sonner";
import { FileDown, Filter, Image as ImageIcon, MapPin, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InformesPage() {
  const [data, setData] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [filtroObra, setFiltroObra] = useState("todos");
  const [filtroResponsable, setFiltroResponsable] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroVariable, setFiltroVariable] = useState("todos");
  const [filtroContratista, setFiltroContratista] = useState("todos");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // --- LISTAS PARA LOS DROPDOWNS ---
  const [obrasList, setObrasList] = useState<string[]>([]);
  const [respList, setRespList] = useState<string[]>([]);
  const [variablesList, setVariablesList] = useState<string[]>([]);
  const [contratistasList, setContratistasList] = useState<string[]>([]);

  // 1. CARGAR DATOS
  useEffect(() => {
    const loadData = async () => {
      try {
        const res: Bitacora[] = await apiGet("/bitacoras");
        setData(res);
        
        // ✅ CORRECCIÓN TÉCNICA:
        // Usamos '(x): x is string => !!x' para asegurar a TypeScript que el resultado es string[]
        
        const obras = Array.from(new Set(
          res.map(b => b.obra?.nombre).filter((x): x is string => !!x)
        ));
        
        const resps = Array.from(new Set(
          res.map(b => b.responsable?.nombreCompleto).filter((x): x is string => !!x)
        ));
        
        const vars = Array.from(new Set(
          res.map(b => b.variable?.nombre).filter((x): x is string => !!x)
        ));
        
        const contras = Array.from(new Set(
          res.map(b => b.contratista?.nombre).filter((x): x is string => !!x)
        ));

        setObrasList(obras);
        setRespList(resps);
        setVariablesList(vars);
        setContratistasList(contras);

      } catch (e) {
        console.error(e);
        toast.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. FILTRADO EN TIEMPO REAL
  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      if (filtroObra !== "todos" && item.obra?.nombre !== filtroObra) return false;
      if (filtroResponsable !== "todos" && item.responsable?.nombreCompleto !== filtroResponsable) return false;
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (filtroVariable !== "todos" && item.variable?.nombre !== filtroVariable) return false;
      if (filtroContratista !== "todos" && item.contratista?.nombre !== filtroContratista) return false;

      if (fechaInicio) {
        if (new Date(item.fechaCreacion).getTime() < new Date(fechaInicio).getTime()) return false;
      }
      if (fechaFin) {
        if (new Date(item.fechaCreacion).getTime() > new Date(fechaFin).getTime() + 86400000) return false;
      }
      return true;
    });
  }, [data, filtroObra, filtroResponsable, filtroEstado, filtroVariable, filtroContratista, fechaInicio, fechaFin]);

  // 3. GENERAR PDF
  const handleDownloadReport = async () => {
    if (datosFiltrados.length === 0) return;
    const toastId = toast.loading(`Generando reporte...`);
    try {
      const blob = await pdf(<BitacoraReportePDF data={datosFiltrados} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Reporte descargado");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar PDF");
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
          <p className="text-gray-500">Filtra y valida la información antes de exportar</p>
        </div>
        
        <Button 
          size="lg" 
          onClick={handleDownloadReport}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
          disabled={datosFiltrados.length === 0}
        >
          <FileDown className="mr-2 h-5 w-5" />
          Descargar PDF ({datosFiltrados.length})
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="border-t-4 border-t-[#0C2D57] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 text-[#0C2D57] font-semibold">
            <Filter className="h-5 w-5" /> Filtros de Auditoría
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. OBRA */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Obra</label>
              <Select value={filtroObra} onValueChange={setFiltroObra}>
                <SelectTrigger className="bg-gray-50"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las obras</SelectItem>
                  {obrasList.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 2. RESPONSABLE */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Responsable</label>
              <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
                <SelectTrigger className="bg-gray-50"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {respList.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 3. ESTADO */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="bg-gray-50"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ABIERTA">Abiertas</SelectItem>
                  <SelectItem value="CERRADA">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. VARIABLE */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Variable de Control</label>
              <Select value={filtroVariable} onValueChange={setFiltroVariable}>
                <SelectTrigger className="bg-gray-50"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {variablesList.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 5. CONTRATISTA */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Contratista</label>
              <Select value={filtroContratista} onValueChange={setFiltroContratista}>
                <SelectTrigger className="bg-gray-50"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {contratistasList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 6. FECHAS */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-gray-500">Fecha Creación</label>
              <div className="flex gap-2">
                <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-gray-50"/>
                <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-gray-50"/>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* VISTA PREVIA */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-[#0C2D57] flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Vista Previa del Contenido
          </h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {datosFiltrados.length} Registros encontrados
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 w-[50px]">ID</th>
                <th className="px-4 py-3 w-[100px]">Fecha</th>
                <th className="px-4 py-3 w-[200px]">Datos Clave</th>
                <th className="px-4 py-3 w-[30%]">Observación (Contenido)</th>
                <th className="px-4 py-3 w-[150px]">Evidencias</th>
                <th className="px-4 py-3 w-[100px]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((bit) => {
                  const numFotos = (bit.evidencias?.length || 0) + (bit.evidenciasSeguimiento?.length || 0);
                  
                  return (
                    <tr key={bit.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-700">#{bit.id}</td>
                      <td className="px-4 py-4 text-gray-600">
                        {new Date(bit.fechaCreacion).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[#0C2D57] text-xs">{bit.variable?.nombre}</span>
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[150px]" title={bit.ubicacion || ""}>
                              {bit.ubicacion || "Sin ubicación"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            Resp: {bit.responsable?.nombreCompleto}
                          </span>
                          {bit.contratista?.nombre && (
                             <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded w-fit">
                               Contr: {bit.contratista.nombre}
                             </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-700 text-sm line-clamp-3" title={bit.observaciones || ""}>
                          {bit.observaciones || <span className="italic text-gray-400">Sin observaciones registradas...</span>}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {numFotos > 0 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {numFotos} Fotos
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 border-gray-200 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Sin Fotos
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={bit.estado === 'ABIERTA' ? 'bg-green-500' : 'bg-red-500'}>
                          {bit.estado}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 text-gray-300" />
                      <p>No hay datos que coincidan con los filtros.</p>
                    </div>
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