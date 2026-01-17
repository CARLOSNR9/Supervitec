"use client";

import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { format } from "date-fns";

import { apiGet, apiPatch, apiPostForm } from "@/lib/api";
import { toast } from "sonner";

// ✅ PDF (React-PDF)
import { pdf } from "@react-pdf/renderer";
import { BitacoraReportePDF } from "./components/BitacoraPDF";

import BitacoraTable from "./components/BitacoraTable";
import BitacoraFormModal from "./components/BitacoraFormModal";
import BitacoraDetailsModal from "./components/BitacoraDetailsModal";

import {
  Bitacora,
  Catalogo,
  Contratista,
  FormState,
  JwtPayload,
  Obra,
} from "./types/bitacora";

import { createInitialFormState } from "./utils/initialForm";
import { exportBitacorasToExcel, exportSingleBitacoraToExcel } from "./utils/excel";

// ✅ FUNCIÓN AUXILIAR PARA MOVER FOTOS
// Convierte una URL de imagen en un objeto File para poder moverlo de sección
async function urlToFile(url: string, filename: string, mimeType: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Error convirtiendo URL a File:", error);
    throw error;
  }
}

export default function BitacorasPage() {
  // =======================
  // STATES
  // =======================
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [variables, setVariables] = useState<Catalogo[]>([]);
  const [mediciones, setMediciones] = useState<Catalogo[]>([]);
  const [unidades, setUnidades] = useState<Catalogo[]>([]);

  // Modal de creación / edición
  const [open, setOpen] = useState(false);

  // Modal de detalle
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBitacora, setSelectedBitacora] = useState<Bitacora | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<FormState>(createInitialFormState());
  const [editingId, setEditingId] = useState<number | null>(null);

  // 📸 (se mantienen por compatibilidad / trazabilidad, aunque ya no borramos por endpoint)
  const [originalPhotos, setOriginalPhotos] = useState<any[]>([]);
  const [originalSeguimientoPhotos, setOriginalSeguimientoPhotos] = useState<
    any[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc" as "asc" | "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // USUARIO LOGUEADO
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);

  // =======================
  // LEER TOKEN
  // =======================
  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("❌ Error decodificando token:", err);
      }
    }
  }, []);

  // ===============================
  // CARGAR DATOS
  // ===============================
  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!currentUser) return;

      const promises = [
        apiGet("/bitacoras"),
        apiGet("/obras"),
        apiGet("/contratistas"),
      ];

      // Catálogos según rol
      if (
        currentUser.role === "ADMIN" ||
        currentUser.role === "DIRECTOR" ||
        currentUser.role === "SUPERVISOR" ||
        currentUser.role === "RESIDENTE"
      ) {
        promises.push(apiGet("/variables"));
        promises.push(apiGet("/mediciones"));
        promises.push(apiGet("/unidades"));
      }

      const results = await Promise.allSettled(promises);

      const bitacorasRes =
        results[0].status === "fulfilled" ? results[0].value : [];
      const obrasRes =
        results[1].status === "fulfilled" ? results[1].value : [];
      const contratistasRes =
        results[2].status === "fulfilled" ? results[2].value : [];

      let variablesRes: any[] = [];
      let medicionesRes: any[] = [];
      let unidadesRes: any[] = [];

      if (
        currentUser.role === "ADMIN" ||
        currentUser.role === "DIRECTOR" ||
        currentUser.role === "SUPERVISOR" ||
        currentUser.role === "RESIDENTE"
      ) {
        variablesRes =
          results[3]?.status === "fulfilled" ? (results[3] as any).value : [];
        medicionesRes =
          results[4]?.status === "fulfilled" ? (results[4] as any).value : [];
        unidadesRes =
          results[5]?.status === "fulfilled" ? (results[5] as any).value : [];
      }

      setBitacoras(bitacorasRes as Bitacora[]);
      setObras((obrasRes as Obra[]).filter((o) => o?.id > 0));
      setContratistas(
        (contratistasRes as Contratista[]).filter((c) => c?.id > 0)
      );

      setVariables(variablesRes as Catalogo[]);
      setMediciones(medicionesRes as Catalogo[]);
      setUnidades(unidadesRes as Catalogo[]);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando datos.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // VALIDAR FORM
  // ===============================
  const validateForm = () => {
    const required: (keyof FormState)[] = [
      "obraId",
      "variableId",
      "medicionId",
      "unidadId",
      "ubicacion",
      "fechaCreacion",
    ];

    for (const f of required) {
      const val = (form[f] as string) || "";
      if (!val || val.trim() === "" || val === "none") {
        setErrorMsg(`El campo ${f} es obligatorio.`);
        return false;
      }
    }
    setErrorMsg("");
    return true;
  };

  // ===============================
  // 💾 SUBMIT (INTELIGENTE + IDS BORRADO + FIELDNAMES DIFERENTES)
  // ===============================
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      // 1️⃣ BUSCAR LA BITÁCORA ORIGINAL (Para comparar fechas)
      const originalBitacora = editingId
        ? bitacoras.find((b) => b.id === editingId)
        : null;

      // ---------------------------------------------------------
      // 🕒 FUNCIÓN AUXILIAR: GESTIÓN DE FECHAS Y HORAS
      // ---------------------------------------------------------
      const resolveDateToSend = (
        formDateString: string,
        originalIsoString?: string | null
      ) => {
        if (!formDateString) return null;

        if (originalIsoString) {
          const originalDatePart = new Date(originalIsoString)
            .toISOString()
            .slice(0, 10);

          if (formDateString === originalDatePart) {
            // NO cambió el día -> mantener hora original
            return originalIsoString;
          }
        }

        // Cambió el día o es nuevo -> mezclar con hora actual
        const now = new Date();
        const [year, month, day] = formDateString.split("-").map(Number);

        const mixedDate = new Date(
          year,
          month - 1,
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        );

        return mixedDate.toISOString();
      };
      // ---------------------------------------------------------

      // 2) FormData
      const fd = new FormData();

      if (form.obraId) fd.append("obraId", form.obraId);
      if (form.contratistaId) fd.append("contratistaId", form.contratistaId);
      if (form.variableId) fd.append("variableId", form.variableId);
      if (form.medicionId) fd.append("medicionId", form.medicionId);
      if (form.unidadId) fd.append("unidadId", form.unidadId);
      fd.append("estado", form.estado);

      // Fecha Creación (solo si es nueva)
      if (!editingId) {
        const fechaC = form.fechaCreacion
          ? new Date(form.fechaCreacion).toISOString()
          : new Date().toISOString();
        fd.append("fechaCreacion", fechaC);
      }

      // Fechas inteligentes
      if (form.fechaMejora) {
        const fechaFinal = resolveDateToSend(
          form.fechaMejora,
          originalBitacora?.fechaMejora
        );
        if (fechaFinal) fd.append("fechaMejora", fechaFinal);
      }

      if (form.fechaEjecucion) {
        const fechaFinal = resolveDateToSend(
          form.fechaEjecucion,
          originalBitacora?.fechaEjecucion
        );
        if (fechaFinal) fd.append("fechaEjecucion", fechaFinal);
      }

      if (form.ubicacion) fd.append("ubicacion", form.ubicacion);
      if (form.observaciones) fd.append("observaciones", form.observaciones);
      if (form.seguimiento) fd.append("seguimiento", form.seguimiento);
      if (form.latitud) fd.append("latitud", form.latitud);
      if (form.longitud) fd.append("longitud", form.longitud);

      // 📸 FOTOS NUEVAS con fieldnames diferentes
      // 1) Iniciales
      if (form.fotoFiles && form.fotoFiles.length > 0) {
        form.fotoFiles.forEach((file) => fd.append("fotoFiles", file));
      }
      // ✅ Enviar metadata serializada para cruzar en backend
      if (form.fotoFilesMetadata && form.fotoFilesMetadata.length > 0) {
        fd.append("fotoMetadata", JSON.stringify(form.fotoFilesMetadata));
      }

      // 2) Seguimiento
      if (form.fotosSeguimiento && form.fotosSeguimiento.length > 0) {
        form.fotosSeguimiento.forEach((file) =>
          fd.append("fotosSeguimiento", file)
        );
      }
      if (form.fotosSeguimientoMetadata && form.fotosSeguimientoMetadata.length > 0) {
        fd.append("fotosSeguimientoMetadata", JSON.stringify(form.fotosSeguimientoMetadata));
      }

      // ✅ ENVIAR LISTAS DE BORRADO (solo en edición)
      if (editingId) {
        if (form.idsToDelete && form.idsToDelete.length > 0) {
          fd.append("idsToDelete", JSON.stringify(form.idsToDelete));
        }
        if (
          form.idsToDeleteSeguimiento &&
          form.idsToDeleteSeguimiento.length > 0
        ) {
          fd.append(
            "idsToDeleteSeguimiento",
            JSON.stringify(form.idsToDeleteSeguimiento)
          );
        }
      }


      // (Dejas esto solo para CREATE, lo mantengo)
      if (!editingId) {
        if (form.fotosExistentes.length > 0) {
          fd.append("fotosExistentes", JSON.stringify(form.fotosExistentes));
        }
        if (form.fotosSeguimientoExistentes.length > 0) {
          fd.append(
            "fotosSeguimientoExistentes",
            JSON.stringify(form.fotosSeguimientoExistentes)
          );
        }
      }

      // 3) Guardar
      if (editingId) {
        await apiPatch(`/bitacoras/${editingId}`, fd);
      } else {
        await apiPostForm(`/bitacoras`, fd);
      }

      toast.success(editingId ? "✔️ Bitácora actualizada" : "✔️ Bitácora creada");

      // Limpieza
      setForm(createInitialFormState());
      setEditingId(null);
      setOriginalPhotos([]);
      setOriginalSeguimientoPhotos([]);
      setOpen(false);

      await fetchData();
    } catch (error: any) {
      console.error("❌ ERROR:", error);
      toast.error(error?.response?.data?.message ?? "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ✏️ EDITAR (CON CORRECCIÓN AUTOMÁTICA DE FOTOS)
  // ===============================

  const handleEdit = async (bitacora: Bitacora) => {
    setOriginalPhotos(bitacora.evidencias || []);
    setOriginalSeguimientoPhotos(bitacora.evidenciasSeguimiento || []);

    let fotosArriba = bitacora.evidencias || [];
    let fotosAbajoNuevas: File[] = [];

    const varName =
      bitacora.variable?.nombre?.toUpperCase().replace(/_/g, " ") || "";
    const isNoConforme =
      varName.includes("PRODUCTO NO CONFORME") || varName.includes("SE RECOMIENDA");

    if (isNoConforme && fotosArriba.length > 3) {
      const toastId = toast.loading("🔄 Reorganizando fotos mal ubicadas...");

      try {
        const fotosParaMover = fotosArriba.slice(3);
        fotosArriba = fotosArriba.slice(0, 3);

        const archivosConvertidos = await Promise.all(
          fotosParaMover.map(async (f, index) => {
            const fullUrl = f.url.startsWith("http")
              ? f.url
              : `${process.env.NEXT_PUBLIC_API_URL}${f.url}`;

            return urlToFile(
              fullUrl,
              `foto_movida_correccion_${index}.jpg`,
              "image/jpeg"
            );
          })
        );

        fotosAbajoNuevas = archivosConvertidos;
        toast.success(
          "✅ La 4ta foto se movió a 'Corrección' automáticamente. Guarda para aplicar."
        );
      } catch (error) {
        console.error("No se pudieron mover las fotos automáticamente", error);
        toast.error("⚠️ No se pudieron mover las fotos automáticamente. Hazlo manual.");

        fotosArriba = bitacora.evidencias || [];
        fotosAbajoNuevas = [];
      } finally {
        toast.dismiss(toastId);
      }
    }

    setEditingId(bitacora.id);

    setForm({
      ...createInitialFormState(),

      obraId: bitacora.obraId?.toString() ?? "",
      contratistaId: bitacora.contratistaId?.toString() ?? "",
      variableId: bitacora.variableId?.toString() ?? "",
      medicionId: bitacora.medicionId?.toString() ?? "",
      unidadId: bitacora.unidadId?.toString() ?? "",

      estado: bitacora.estado,

      // ✅ FIX: respeta hora local (Colombia) para datetime-local
      fechaCreacion: bitacora.fechaCreacion
        ? format(new Date(bitacora.fechaCreacion), "yyyy-MM-dd'T'HH:mm")
        : "",

      // ✅ Recomendado: también en formato local para evitar corrimientos
      fechaEjecucion: bitacora.fechaEjecucion
        ? format(new Date(bitacora.fechaEjecucion), "yyyy-MM-dd")
        : "",

      fechaMejora: bitacora.fechaMejora
        ? format(new Date(bitacora.fechaMejora), "yyyy-MM-dd")
        : "",

      ubicacion: bitacora.ubicacion ?? "",
      observaciones: bitacora.observaciones ?? "",
      seguimiento: bitacora.seguimiento ?? "",

      latitud: bitacora.latitud?.toString() ?? "",
      longitud: bitacora.longitud?.toString() ?? "",

      // ⭐ Nuevas fotos (vacías arriba) + fotos movidas a corrección abajo
      fotoFiles: [],
      fotosSeguimiento: fotosAbajoNuevas,

      // ⭐ Fotos existentes arriba (máximo 3)
      fotosExistentes: fotosArriba.map((f) => ({
        id: f.id,
        url: f.url.startsWith("http")
          ? f.url
          : `${process.env.NEXT_PUBLIC_API_URL}${f.url}`,
      })),

      // ✅ FIX: si ya es http (Cloudinary), se deja intacta; si es relativa, se completa
      fotosSeguimientoExistentes:
        bitacora.evidenciasSeguimiento?.map((f) => ({
          id: f.id,
          url: f.url.startsWith("http")
            ? f.url
            : `${process.env.NEXT_PUBLIC_API_URL}${f.url}`,
        })) ?? [],
    });

    setOpen(true);
  };








  // ✅ VER DETALLE
  const handleView = (bitacora: Bitacora) => {
    setSelectedBitacora(bitacora);
    setViewModalOpen(true);
  };

  // =====================================================================
  // 🔍 FILTROS, SORT, ESTADÍSTICAS, PAGINACIÓN, EXPORT, RENDER...
  // =====================================================================

  const filteredBitacoras = useMemo(() => {
    if (!searchTerm) return bitacoras;
    const term = searchTerm.toLowerCase();

    return bitacoras.filter(
      (b) =>
        b.id.toString().includes(term) ||
        (b.codigo?.toLowerCase().includes(term) ?? false) ||
        b.obra?.nombre.toLowerCase().includes(term) ||
        b.responsable?.nombreCompleto.toLowerCase().includes(term) ||
        b.contratista?.nombre.toLowerCase().includes(term) ||
        b.registro?.toLowerCase().includes(term)
    );
  }, [bitacoras, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredBitacoras.length;
    const abiertas = filteredBitacoras.filter((b) => b.estado === "ABIERTA").length;
    const cerradas = filteredBitacoras.filter((b) => b.estado === "CERRADA").length;

    const today = new Date().toDateString(); // "Fri Jan 17 2026" comparison
    const creadasHoy = filteredBitacoras.filter((b) => {
      return b.fechaCreacion && new Date(b.fechaCreacion).toDateString() === today;
    }).length;

    return {
      total,
      abiertas,
      cerradas,
      creadasHoy,
    };
  }, [filteredBitacoras]);

  const getSortableValue = (row: Bitacora, key: string) => {
    switch (key) {
      case "codigo":
        return row.codigo ?? "";
      case "obra":
        return row.obra?.nombre ?? "";
      case "responsable":
        return row.responsable?.nombreCompleto ?? "";
      case "variable":
        return row.variable?.nombre ?? "";
      case "medicion":
        return row.medicion?.nombre ?? "";
      case "unidad":
        return row.unidadRel?.nombre ?? row.unidad ?? "";
      case "estado":
        return row.estado ?? "";
      case "fechaCreacion":
        return row.fechaCreacion ?? "";
      case "fechaEjecucion":
        return row.fechaEjecucion ?? "";
      case "id":
        return row.id;
      default:
        // @ts-ignore
        return row[key] ?? "";
    }
  };

  const sortedBitacoras = useMemo(() => {
    const sorted = [...filteredBitacoras];
    sorted.sort((a, b) => {
      const valA = getSortableValue(a, sortConfig.key);
      const valB = getSortableValue(b, sortConfig.key);

      if (sortConfig.direction === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    return sorted;
  }, [filteredBitacoras, sortConfig]);

  useEffect(() => setCurrentPage(1), [searchTerm, sortConfig]);

  const totalPages = Math.ceil(sortedBitacoras.length / itemsPerPage);

  const paginatedBitacoras = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedBitacoras.slice(start, start + itemsPerPage);
  }, [sortedBitacoras, currentPage]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const printReport = () => {
    const html = document.querySelector("table")?.outerHTML;
    if (!html) {
      toast.error("No hay tabla.");
      return;
    }
    const win = window.open("", "_blank");
    win!.document.write(`
      <html>
        <head>
          <title>Reporte</title>
          <style>
            body{font-family:Arial;padding:20px;}
            table{border-collapse:collapse;width:100%;}
            th,td{border:1px solid #ccc;padding:8px;}
            th{background:#0C2D57;color:white;}
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    win!.document.close();
    win!.print();
  };

  // ===============================
  // 🖨️ PDF INDIVIDUAL
  // ===============================
  const handleGeneratePDF = async (bitacora: Bitacora) => {
    const toastId = toast.loading("Generando PDF...");

    try {
      const blob = await pdf(<BitacoraReportePDF data={[bitacora]} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bitacora_${bitacora.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.dismiss(toastId);
      toast.error("Error generando PDF. Intenta de nuevo.");
    }
  };

  return (
    <main className="p-4 md:p-8">
      <BitacoraTable
        bitacoras={paginatedBitacoras}
        stats={stats}
        sortConfig={sortConfig}
        onSort={handleSort}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
        onRefresh={fetchData}
        onNew={() => {
          setEditingId(null);
          setForm(createInitialFormState());
          setOpen(true);
        }}
        onExportExcel={() => exportBitacorasToExcel(bitacoras)}
        onPrint={printReport}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onGenerateExcel={exportSingleBitacoraToExcel}
        onGeneratePDF={handleGeneratePDF}
        onView={handleView}
      />

      <BitacoraFormModal
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        obras={obras}
        contratistas={contratistas}
        variables={variables}
        mediciones={mediciones}
        unidades={unidades}
        userInfo={currentUser}
        loading={loading}
        errorMsg={errorMsg}
        onSubmit={handleSubmit}
        isEditing={editingId !== null}
      />

      <BitacoraDetailsModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        data={selectedBitacora}
      />
    </main>
  );
}
