"use client";

import { useState, useEffect, useMemo } from "react";
import { apiGet } from "@/lib/api";
import { Bitacora } from "../types/bitacora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { pdf } from "@react-pdf/renderer";
import { BitacoraReportePDF } from "../components/BitacoraPDF";
import { toast } from "sonner";
import {
  FileDown,
  Filter,
  Image as ImageIcon,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  User as UserIcon,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InformesPage() {
  const [data, setData] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Estado para colapsar filtros en móvil
  const [showFilters, setShowFilters] = useState(false);

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

        const obras = Array.from(
          new Set(res.map((b) => b.obra?.nombre).filter((x): x is string => !!x))
        );
        const resps = Array.from(
          new Set(
            res
              .map((b) => b.responsable?.nombreCompleto)
              .filter((x): x is string => !!x)
          )
        );
        const vars = Array.from(
          new Set(
            res.map((b) => b.variable?.nombre).filter((x): x is string => !!x)
          )
        );
        const contras = Array.from(
          new Set(
            res
              .map((b) => b.contratista?.nombre)
              .filter((x): x is string => !!x)
          )
        );

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

  // 2.5 ESTADO DE ORDENAMIENTO
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({ key: "id", direction: "desc" }); // Default: ID descendente

  // 2. FILTRADO Y ORDENAMIENTO
  const datosFiltrados = useMemo(() => {
    let filtered = data.filter((item) => {
      if (filtroObra !== "todos" && item.obra?.nombre !== filtroObra) return false;
      if (
        filtroResponsable !== "todos" &&
        item.responsable?.nombreCompleto !== filtroResponsable
      )
        return false;
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (
        filtroVariable !== "todos" &&
        item.variable?.nombre !== filtroVariable
      )
        return false;
      if (
        filtroContratista !== "todos" &&
        item.contratista?.nombre !== filtroContratista
      )
        return false;

      if (fechaInicio) {
        if (new Date(item.fechaCreacion).getTime() < new Date(fechaInicio).getTime())
          return false;
      }
      if (fechaFin) {
        // Incluye todo el día de fechaFin
        if (
          new Date(item.fechaCreacion).getTime() >
          new Date(fechaFin).getTime() + 86400000
        )
          return false;
      }

      return true;
    });

    // APLICAR ORDENAMIENTO
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = "";
        let bValue: any = "";

        switch (sortConfig.key) {
          case "id":
            aValue = a.id;
            bValue = b.id;
            break;
          case "codigo":
            aValue = a.codigo || "";
            bValue = b.codigo || "";
            break;
          case "fecha":
            aValue = new Date(a.fechaCreacion).getTime();
            bValue = new Date(b.fechaCreacion).getTime();
            break;
          case "variable":
            aValue = a.variable?.nombre || "";
            bValue = b.variable?.nombre || "";
            break;
          case "observacion":
            aValue = a.observaciones || "";
            bValue = b.observaciones || "";
            break;
          case "evidencias":
            aValue =
              (a.evidencias?.length || 0) + (a.evidenciasSeguimiento?.length || 0);
            bValue =
              (b.evidencias?.length || 0) + (b.evidenciasSeguimiento?.length || 0);
            break;
          case "estado":
            aValue = a.estado;
            bValue = b.estado;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    data,
    filtroObra,
    filtroResponsable,
    filtroEstado,
    filtroVariable,
    filtroContratista,
    fechaInicio,
    fechaFin,
    sortConfig,
  ]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const RenderSortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <div className="w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // 3. GENERAR PDF
  const handleDownloadReport = async () => {
    if (datosFiltrados.length === 0) return;
    const toastId = toast.loading(`Generando reporte...`);
    try {
      const blob = await pdf(<BitacoraReportePDF data={datosFiltrados} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_${new Date().toISOString().slice(0, 10)}.pdf`;
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20 bg-gray-50 min-h-screen">
      {/* === 1. ENCABEZADO === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
            Centro de Informes
          </h1>
          <p className="text-sm text-gray-500">
            Filtra y valida la información antes de exportar
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleDownloadReport}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95"
          disabled={datosFiltrados.length === 0 || loading}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Descargar PDF ({datosFiltrados.length})
        </Button>
      </div>

      {/* === 2. FILTROS (COLLAPSIBLE EN MÓVIL) === */}
      <Card className="border-t-4 border-t-[#0C2D57] shadow-sm">
        <div
          className="p-4 flex justify-between items-center cursor-pointer md:cursor-default"
          onClick={() => setShowFilters((s) => !s)}
        >
          <div className="flex items-center gap-2 text-[#0C2D57] font-semibold">
            <Filter className="h-5 w-5" />
            <span>Filtros de Auditoría</span>
          </div>

          {/* Icono solo visible en móvil */}
          <div className="md:hidden text-gray-400">
            {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        <CardContent
          className={`${showFilters ? "block" : "hidden"} md:block border-t md:border-t-0 p-4 pt-0`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {/* 1. OBRA */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Obra
              </label>
              <Select value={filtroObra} onValueChange={setFiltroObra}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Todas las obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las obras</SelectItem>
                  {obrasList.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. RESPONSABLE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Responsable
              </label>
              <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {respList.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. ESTADO */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Estado
              </label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ABIERTA">Abiertas</SelectItem>
                  <SelectItem value="CERRADA">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. VARIABLE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Variable
              </label>
              <Select value={filtroVariable} onValueChange={setFiltroVariable}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {variablesList.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 5. CONTRATISTA */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Contratista
              </label>
              <Select
                value={filtroContratista}
                onValueChange={setFiltroContratista}
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {contratistasList.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. FECHAS */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Fecha Creación
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-gray-50 text-xs"
                />
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-gray-50 text-xs"
                />
              </div>
            </div>
          </div>

          {loading && (
            <p className="text-xs text-gray-500 mt-3 animate-pulse">
              Cargando datos...
            </p>
          )}
        </CardContent>
      </Card>

      {/* === 3. CONTENIDO: TABLA (DESKTOP) vs CARDS (MÓVIL) === */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Vista Previa
          </h2>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
            {datosFiltrados.length} Registros
          </span>
        </div>

        {/* --- TABLA (DESKTOP) --- */}
        <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th
                  className="px-6 py-3 w-[70px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center gap-1">
                    ID <RenderSortIcon columnKey="id" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 w-[100px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("codigo")}
                >
                  <div className="flex items-center gap-1">
                    COD <RenderSortIcon columnKey="codigo" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 w-[120px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("fecha")}
                >
                  <div className="flex items-center gap-1">
                    Fecha <RenderSortIcon columnKey="fecha" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 w-[240px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("variable")}
                >
                  <div className="flex items-center gap-1">
                    Datos Clave <RenderSortIcon columnKey="variable" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("observacion")}
                >
                  <div className="flex items-center gap-1">
                    Observación <RenderSortIcon columnKey="observacion" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 w-[160px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("evidencias")}
                >
                  <div className="flex items-center gap-1">
                    Evidencias <RenderSortIcon columnKey="evidencias" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 w-[120px] cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort("estado")}
                >
                  <div className="flex items-center gap-1">
                    Estado <RenderSortIcon columnKey="estado" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((bit) => {
                  const numFotos =
                    (bit.evidencias?.length || 0) +
                    (bit.evidenciasSeguimiento?.length || 0);

                  return (
                    <tr
                      key={bit.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-bold text-[#0C2D57]">
                        #{bit.id}
                      </td>

                      {/* COLUMNA CODIGO NUEVA */}
                      <td className="px-6 py-4 font-medium text-gray-600">
                        {bit.codigo || <span className="text-gray-300">-</span>}
                      </td>

                      <td className="px-6 py-4">
                        {new Date(bit.fechaCreacion).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-[#0C2D57]">
                          {bit.variable?.nombre ?? "—"}
                        </p>
                        <p className="text-xs flex items-center gap-1 mt-1">
                          <MapPin size={10} />{" "}
                          <span
                            className="truncate max-w-[200px]"
                            title={bit.ubicacion || ""}
                          >
                            {bit.ubicacion || "Sin ubicación"}
                          </span>
                        </p>
                        <p className="text-xs flex items-center gap-1 text-gray-400">
                          <UserIcon size={10} />{" "}
                          {bit.responsable?.nombreCompleto ?? "—"}
                        </p>
                        {bit.contratista?.nombre && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded w-fit inline-block mt-1">
                            Contr: {bit.contratista.nombre}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-md truncate" title={bit.observaciones || ""}>
                        {bit.observaciones || (
                          <span className="italic text-gray-400">
                            Sin observaciones...
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {numFotos > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <ImageIcon size={12} /> {numFotos} Fotos
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Sin Fotos
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          className={
                            bit.estado === "ABIERTA" ? "bg-green-500" : "bg-red-500"
                          }
                        >
                          {bit.estado}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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

        {/* --- CARDS (MÓVIL) --- */}
        <div className="md:hidden space-y-4">
          {datosFiltrados.length > 0 ? (
            datosFiltrados.map((bit) => {
              const fecha = new Date(bit.fechaCreacion).toLocaleDateString();
              const variable = (bit.variable?.nombre ?? "—").replace(/_/g, " ");
              const ubicacion = bit.ubicacion || "Sin ubicación";
              const responsable = bit.responsable?.nombreCompleto || "—";
              const observacion = bit.observaciones || "";
              const numFotos =
                (bit.evidencias?.length || 0) +
                (bit.evidenciasSeguimiento?.length || 0);

              return (
                <div
                  key={bit.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 active:bg-gray-50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-[#0C2D57]">
                        #{bit.id}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarIcon size={12} /> {fecha}
                      </span>
                    </div>

                    <Badge
                      className={`${bit.estado === "ABIERTA"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                        } border-0`}
                    >
                      {bit.estado}
                    </Badge>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Body */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Variable
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {variable}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Ubicación
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {ubicacion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Resp.
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {responsable}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic border border-gray-100">
                      {observacion ? (
                        `"${observacion}"`
                      ) : (
                        <span className="text-gray-400 italic">
                          Sin observaciones...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-1 pt-2">
                    {numFotos > 0 ? (
                      <Badge
                        variant="outline"
                        className="text-gray-500 gap-1 pl-1 pr-2 py-1"
                      >
                        <div className="bg-gray-200 p-1 rounded-full">
                          <ImageIcon size={10} />
                        </div>
                        {numFotos} Evidencias
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Sin Fotos
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <Filter className="h-8 w-8 text-gray-300" />
                <p>No hay datos que coincidan con los filtros.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
