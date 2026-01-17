// app/bitacoras/utils/excel.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Bitacora } from "../types/bitacora";

export const exportBitacorasToExcel = (bitacoras: Bitacora[]) => {
  if (!bitacoras.length) return;

  const data = bitacoras.map((b) => ({
    ID: b.id,
    Obra: b.obra?.nombre ?? "",
    Responsable: b.responsable?.nombreCompleto ?? "",
    Estado: b.estado,
    "Fecha de Creación": b.fechaCreacion
      ? new Date(b.fechaCreacion).toLocaleString("es-CO")
      : "",
    Variable: b.variable?.nombre ?? "",
    Observaciones: b.observaciones ?? "",
    Medición: b.medicion?.nombre ?? "",
    Unidad: b.unidadRel?.nombre ?? b.unidad ?? "",
    "Fecha de Ejecución": b.fechaEjecucion
      ? new Date(b.fechaEjecucion).toLocaleDateString("es-CO")
      : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bitacoras");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Bitacoras_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportSingleBitacoraToExcel = (b: Bitacora) => {
  // Datos principales
  const mainData = [
    { Campo: "ID", Valor: b.id },
    { Campo: "Código", Valor: b.codigo ?? "" },
    { Campo: "Obra", Valor: b.obra?.nombre ?? "" },
    { Campo: "Responsable", Valor: b.responsable?.nombreCompleto ?? "" },
    { Campo: "Estado", Valor: b.estado },
    { Campo: "Fecha de Creación", Valor: b.fechaCreacion ? new Date(b.fechaCreacion).toLocaleString("es-CO") : "" },
    { Campo: "Variable", Valor: b.variable?.nombre ?? "" },
    { Campo: "Ubicación", Valor: b.ubicacion ?? "" },
    { Campo: "Observaciones", Valor: b.observaciones ?? "" },
    { Campo: "Medición", Valor: b.medicion?.nombre ?? "" },
    { Campo: "Unidad", Valor: b.unidadRel?.nombre ?? b.unidad ?? "" },
    { Campo: "Fecha de Ejecución", Valor: b.fechaEjecucion ? new Date(b.fechaEjecucion).toLocaleDateString("es-CO") : "" },
    { Campo: "Contratista", Valor: b.contratista?.nombre ?? "" },
    { Campo: "Seguimiento", Valor: b.seguimiento ?? "" },
    { Campo: "Latitud", Valor: b.latitud ?? "" },
    { Campo: "Longitud", Valor: b.longitud ?? "" },
    { Campo: "Fecha Mejora", Valor: b.fechaMejora ? new Date(b.fechaMejora).toLocaleDateString("es-CO") : "" },
  ];

  // Evidencias (Fotos)
  const evidencias = (b.evidencias || []).map((f, i) => ({
    Tipo: "Evidencia Inicial",
    Indice: i + 1,
    URL: f.url.startsWith("http") ? f.url : `${process.env.NEXT_PUBLIC_API_URL}${f.url}`
  }));

  const evidenciasSeguimiento = (b.evidenciasSeguimiento || []).map((f, i) => ({
    Tipo: "Evidencia Seguimiento",
    Indice: i + 1,
    URL: f.url.startsWith("http") ? f.url : `${process.env.NEXT_PUBLIC_API_URL}${f.url}`
  }));

  const wb = XLSX.utils.book_new();

  // Hoja 1: Datos Generales
  const wsMain = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, wsMain, "Detalle Bitácora");

  // Hoja 2: Enlaces a Fotos
  if (evidencias.length > 0 || evidenciasSeguimiento.length > 0) {
    const wsFotos = XLSX.utils.json_to_sheet([...evidencias, ...evidenciasSeguimiento]);
    XLSX.utils.book_append_sheet(wb, wsFotos, "Fotos");
  }

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Bitacora_${b.codigo || b.id}_${new Date().toISOString().split("T")[0]}.xlsx`);
};
