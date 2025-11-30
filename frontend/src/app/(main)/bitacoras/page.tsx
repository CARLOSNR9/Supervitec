"use client";

import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

// ⬅️ CAMBIO: apiPut eliminado, apiPatch agregado
import { apiGet, apiPost, apiPatch } from "@/lib/api";

import { toast } from "sonner";

// 📌 IMPORTS PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

import BitacoraTable from "./components/BitacoraTable";
import BitacoraFormModal from "./components/BitacoraFormModal";

import {
  Bitacora,
  Catalogo,
  Contratista,
  FormState,
  JwtPayload,
  Obra,
} from "./types/bitacora";

import { createInitialFormState } from "./utils/initialForm";
import { exportBitacorasToExcel } from "./utils/excel";

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

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<FormState>(createInitialFormState());
  const [editingId, setEditingId] = useState<number | null>(null);

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
  // SUBMIT
  // ===============================
 

const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);

  try {
    const token = Cookies.get("svtec_token");
    if (!token) {
      toast.error("No hay token.");
      setLoading(false);
      return;
    }

    // ==========================
    // 🟩 FORM DATA
    // ==========================
    const fd = new FormData();

    // IDs numéricos
    if (form.obraId) fd.append("obraId", form.obraId);
    if (form.contratistaId) fd.append("contratistaId", form.contratistaId);
    if (form.variableId) fd.append("variableId", form.variableId);
    if (form.medicionId) fd.append("medicionId", form.medicionId);
    if (form.unidadId) fd.append("unidadId", form.unidadId);

    // Estado
    fd.append("estado", form.estado);

    // Fechas obligatorias / opcionales
    fd.append("fechaCreacion", new Date(form.fechaCreacion).toISOString());

    if (form.fechaMejora) {
      fd.append("fechaMejora", new Date(form.fechaMejora).toISOString());
    }

    if (form.fechaEjecucion) {
      fd.append("fechaEjecucion", new Date(form.fechaEjecucion).toISOString());
    }

    // Strings
    if (form.ubicacion?.trim()) fd.append("ubicacion", form.ubicacion.trim());
    if (form.observaciones?.trim()) fd.append("observaciones", form.observaciones.trim());
    if (form.seguimiento?.trim()) fd.append("seguimiento", form.seguimiento.trim());

    // GPS
    if (form.latitud) fd.append("latitud", form.latitud);
    if (form.longitud) fd.append("longitud", form.longitud);

    // ==========================
    // 🟦 FOTOS NUEVAS (NORMALES)
    // backend: FilesInterceptor('files')
    // ==========================
    if (form.fotoFiles && form.fotoFiles.length > 0) {
      form.fotoFiles.forEach((file) => {
        fd.append("files", file); // 🔥 ESTE NOMBRE DEBE SER EXACTO
      });
    }

    // ==========================
    // 🟧 FOTOS DE SEGUIMIENTO NUEVAS
    // (si luego quieres agregarlas al backend, se agrega otro Interceptor)
    // ==========================
    if (form.fotosSeguimiento && form.fotosSeguimiento.length > 0) {
      form.fotosSeguimiento.forEach((file) => {
        fd.append("files", file); // se envían igual por ahora
      });
    }

    // ==========================
    // 🌟 FOTOS EXISTENTES (NO SE BORRAN)
    // ==========================
    if (form.fotosExistentes && form.fotosExistentes.length > 0) {
      fd.append(
        "fotosExistentes",
        JSON.stringify(form.fotosExistentes)
      );
    }

    if (form.fotosSeguimientoExistentes && form.fotosSeguimientoExistentes.length > 0) {
      fd.append(
        "fotosSeguimientoExistentes",
        JSON.stringify(form.fotosSeguimientoExistentes)
      );
    }

    // =======================================
    // 🟩 ENVIAR AL BACKEND
    //   SI HAY editingId → PATCH
    //   Si no → POST
    // =======================================
    const url = editingId
      ? `/bitacoras/${editingId}`
      : `/bitacoras`;

    const method = editingId ? apiPatch : apiPost;

    await method(url, fd); // axios manda FormData automáticamente

    toast.success(
      editingId
        ? "✔️ Bitácora actualizada"
        : "✔️ Bitácora creada"
    );

    // ==========================
    // RESET + RELOAD
    // ==========================
    setForm(createInitialFormState());
    setEditingId(null);
    setOpen(false);

    await fetchData();
  } catch (error: any) {
    console.error("❌ ERROR SUBMIT:", error);
    toast.error(
      error?.response?.data?.message ??
        "Error al guardar la bitácora."
    );
  } finally {
    setLoading(false);
  }
};




  // ===============================
  // EDITAR
  // ===============================

const handleEdit = (bitacora: Bitacora) => {
  setEditingId(bitacora.id);

  setForm({
    ...createInitialFormState(),

    obraId: bitacora.obraId?.toString() ?? "",
    contratistaId: bitacora.contratistaId?.toString() ?? "",
    variableId: bitacora.variableId?.toString() ?? "",
    medicionId: bitacora.medicionId?.toString() ?? "",
    unidadId: bitacora.unidadId?.toString() ?? "",

    estado: bitacora.estado,

    fechaCreacion: bitacora.fechaCreacion
      ? new Date(bitacora.fechaCreacion).toISOString().slice(0, 16)
      : "",

    fechaEjecucion: bitacora.fechaEjecucion
      ? new Date(bitacora.fechaEjecucion).toISOString().slice(0, 10)
      : "",

    fechaMejora: bitacora.fechaMejora
      ? new Date(bitacora.fechaMejora).toISOString().slice(0, 10)
      : "",

    ubicacion: bitacora.ubicacion ?? "",
    observaciones: bitacora.observaciones ?? "",
    seguimiento: bitacora.seguimiento ?? "",

    latitud: bitacora.latitud?.toString() ?? "",
    longitud: bitacora.longitud?.toString() ?? "",

    // ⭐ Nuevas fotos (vacías)
    fotoFiles: [],
    fotosSeguimiento: [],

    // ⭐ Fotos que vienen del backend (mostrar en modal)
    fotosExistentes:
      bitacora.evidencias?.map((f) => ({
        id: f.id,
        url: `${process.env.NEXT_PUBLIC_API_URL}${f.url}`,
      })) ?? [],

    fotosSeguimientoExistentes:
      bitacora.evidenciasSeguimiento?.map((f) => ({
        id: f.id,
        url: `${process.env.NEXT_PUBLIC_API_URL}${f.url}`,
      })) ?? [],
  });

  setOpen(true);
};







  // ⬇️ El resto del archivo se mantiene exactamente igual
  // =====================================================================
  // FILTROS, SORT, ESTADÍSTICAS, PAGINACIÓN, EXPORT, RENDER...
  // =====================================================================

  const filteredBitacoras = useMemo(() => {
    if (!searchTerm) return bitacoras;
    const term = searchTerm.toLowerCase();
    return bitacoras.filter(
      (b) =>
        b.obra?.nombre.toLowerCase().includes(term) ||
        b.responsable?.nombreCompleto.toLowerCase().includes(term) ||
        b.contratista?.nombre.toLowerCase().includes(term) ||
        b.registro?.toLowerCase().includes(term)
    );
  }, [bitacoras, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredBitacoras.length;
    const abiertas = filteredBitacoras.filter(
      (b) => b.estado === "ABIERTA"
    ).length;
    const cerradas = filteredBitacoras.filter(
      (b) => b.estado === "CERRADA"
    ).length;

    let lastTs = 0;
    for (const b of filteredBitacoras) {
      const fechas: number[] = [];
      if (b.fechaCreacion) fechas.push(new Date(b.fechaCreacion).getTime());
      if (b.fechaEjecucion)
        fechas.push(new Date(b.fechaEjecucion).getTime());
      if (fechas.length) lastTs = Math.max(lastTs, ...fechas);
    }

    return {
      total,
      abiertas,
      cerradas,
      ultimaActualizada: lastTs ? new Date(lastTs) : null,
    };
  }, [filteredBitacoras]);

  const getSortableValue = (row: Bitacora, key: string) => {
    switch (key) {
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
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
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

  const handleGeneratePDF = async (bitacora: Bitacora) => {
    try {
      const element = document.createElement("div");
      element.style.padding = "20px";
      element.style.width = "800px";

      element.innerHTML = `
        <h2>Informe de Bitácora #${bitacora.id}</h2>
      `;

      document.body.appendChild(element);

      const canvas = await html2canvas(element, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const pdf = new jsPDF();
      pdf.addImage(img, "PNG", 10, 10, 190, 0);
      pdf.save(`bitacora_${bitacora.id}.pdf`);

      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
      toast.error("Error generando PDF.");
    }
  };

  return (
    <main className="p-8">
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
        onExportExcel={exportBitacorasToExcel}
        onPrint={printReport}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onGeneratePDF={handleGeneratePDF}
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
    </main>
  );
}
