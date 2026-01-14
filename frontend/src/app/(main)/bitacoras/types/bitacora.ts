// app/bitacoras/types/bitacora.ts

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

export interface Contratista {
  id: number;
  nombre: string;
}

export interface Responsable {
  id?: number;
  nombreCompleto: string;
}

export interface Obra {
  id: number;
  prefijo?: string | null;
  nombre: string;
}

export interface Catalogo {
  id: number;
  nombre: string;
  observaciones?: string | null;
}

export interface UnidadRel {
  id: number;
  nombre: string;
}

export interface VariableRel {
  id: number;
  nombre: string;
}

export interface MedicionRel {
  id: number;
  nombre: string;
}

export interface BitacoraMedia {
  id: number;
  url: string;
  createdAt?: string; // ✅ AGREGADO (con ? por si acaso viene vacío en algun caso raro)
}

export interface Bitacora {
  id: number;
  codigo?: string | null; // 🔥 NUEVO CAMPO AGREGADO
  obraId: number;
  responsableId: number;
  contratistaId: number | null;

  variableId: number | null;
  medicionId: number | null;
  unidadId: number | null;

  estado: "ABIERTA" | "CERRADA";
  fechaCreacion: string;
  fechaMejora: string | null;
  fechaEjecucion: string | null;

  ubicacion: string;
  registro: string;

  unidad: string | null;

  observaciones: string | null;
  seguimiento: string | null;

  latitud: number | null;
  longitud: number | null;

  obra: { id: number; nombre: string; prefijo?: string | null };
  responsable: Responsable;
  contratista: Contratista | null;

  variable?: VariableRel | null;
  medicion?: MedicionRel | null;
  unidadRel?: UnidadRel | null;

  evidencias?: BitacoraMedia[];
  evidenciasSeguimiento?: BitacoraMedia[];
}

export interface FormState {
  obraId: string;
  contratistaId: string;
  variableId: string;
  medicionId: string;
  unidadId: string;
  estado: string;

  fechaCreacion: string;
  fechaMejora: string;
  fechaEjecucion: string;

  ubicacion: string;
  observaciones: string;
  seguimiento: string;

  latitud: string;
  longitud: string;

  fotoFiles: File[];
  fotosSeguimiento: File[];

  fotosExistentes: { id: number; url: string }[];
  fotosSeguimientoExistentes: { id: number; url: string }[];

  // ✅ NUEVOS CAMPOS PARA BORRADO DIFERIDO
  idsToDelete: number[]; // Para fotos normales
  idsToDeleteSeguimiento: number[]; // Para fotos de seguimiento
}
