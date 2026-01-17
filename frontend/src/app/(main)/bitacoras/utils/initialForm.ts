// app/bitacoras/utils/initialForm.ts
import { format } from "date-fns";
import { FormState } from "../types/bitacora";

export const createInitialFormState = (): FormState => ({
  obraId: "",
  contratistaId: "",
  variableId: "",
  medicionId: "",
  unidadId: "",
  estado: "ABIERTA",

  // Mantenemos tu formato de fecha actual
  fechaCreacion: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  fechaMejora: "",
  fechaEjecucion: "",

  ubicacion: "",
  observaciones: "",
  seguimiento: "",

  latitud: "",
  longitud: "",

  fotoFiles: [],
  fotosSeguimiento: [],

  fotoFilesMetadata: [],
  fotosSeguimientoMetadata: [],

  fotosExistentes: [],
  fotosSeguimientoExistentes: [],

  // ✅ AGREGADOS PARA CORREGIR EL ERROR DE BUILD
  idsToDelete: [],
  idsToDeleteSeguimiento: [],
});