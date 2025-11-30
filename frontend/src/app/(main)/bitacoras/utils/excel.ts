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
