"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { MapPin, Map } from "lucide-react";

import {
  Catalogo,
  Contratista,
  FormState,
  JwtPayload,
  Obra,
} from "../types/bitacora";

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
});

interface BitacoraFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;

  obras: Obra[];
  contratistas: Contratista[];
  variables: Catalogo[];
  mediciones: Catalogo[];
  unidades: Catalogo[];

  userInfo: JwtPayload | null;
  loading: boolean;
  errorMsg: string;
  onSubmit: () => void;
  isEditing: boolean;
}

export default function BitacoraFormModal({
  open,
  onOpenChange,
  form,
  setForm,
  obras,
  contratistas,
  variables,
  mediciones,
  unidades,
  userInfo,
  loading,
  errorMsg,
  onSubmit,
  isEditing,
}: BitacoraFormModalProps) {
  const [mapOpen, setMapOpen] = useState(false);

  const selectedVar = useMemo(
    () => variables.find((v) => v.id.toString() === form.variableId),
    [form.variableId, variables]
  );

  const isProductoNoConformeOrSeRecomienda = useMemo(() => {
    const nombre = selectedVar?.nombre?.toUpperCase()?.trim() ?? "";
    return nombre === "PRODUCTO_NO_CONFORME" || nombre === "SE_RECOMIENDA";
  }, [selectedVar]);

  useEffect(() => {
    if (!isProductoNoConformeOrSeRecomienda) {
      setForm((f) => ({ ...f, seguimiento: "", fotosSeguimiento: [] }));
    }
  }, [isProductoNoConformeOrSeRecomienda]);

  const getGeoLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("❌ La geolocalización no está disponible.");
      return;
    }

    toast.info("Buscando ubicación GPS...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const long = position.coords.longitude.toFixed(6);

        setForm((prev) => ({
          ...prev,
          latitud: lat,
          longitud: long,
        }));

        toast.success(`📍 GPS Capturado: ${lat}, ${long}`);
      },
      
(err) => {
  console.error("Geolocation error:", err);
  const code = err?.code;

  // 1 = permiso denegado, 2 = posición no disponible, 3 = timeout
  const msg =
    code === 1
      ? "❌ Permiso de ubicación denegado en el navegador."
      : code === 2
      ? "❌ Ubicación no disponible (PC sin GPS / sin Wi-Fi location)."
      : code === 3
      ? "❌ Tiempo de espera agotado obteniendo ubicación."
      : `❌ No se pudo obtener la ubicación GPS. (${err?.message ?? "sin detalle"})`;

  toast.error(msg);
},



      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* ✅ CORRECCIÓN MÓVIL: max-h-[90vh] + overflow-y-auto permite scroll interno en el modal */}
        <DialogContent className="w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Bitácora" : "Nuevo Registro de Bitácora"}
            </DialogTitle>

            {userInfo && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-[#0C2D57]">Responsable:</span>{" "}
                {userInfo.username}{" "}
                <span className="text-xs text-gray-500">({userInfo.role})</span>
              </p>
            )}
          </DialogHeader>

          {open && (
            // ✅ Grid responsiva: 1 columna en móvil, 2 en tablet, 4 en PC
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">

              {/* ESTADO */}
              <Select
                value={form.estado}
                onValueChange={(v) => setForm({ ...form, estado: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABIERTA">ABIERTA</SelectItem>
                  <SelectItem value="CERRADA">CERRADA</SelectItem>
                </SelectContent>
              </Select>

              {/* FECHA CREACIÓN BLOQUEADA */}
              <Input
                type="datetime-local"
                value={form.fechaCreacion}
                disabled
                readOnly
                className="cursor-not-allowed bg-gray-100"
              />

              {/* OBRA */}
              <div className="col-span-1 md:col-span-2">
                <Select
                    value={form.obraId || "none"}
                    onValueChange={(v) =>
                    setForm({ ...form, obraId: v === "none" ? "" : v })
                    }
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Obra *" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="none">-- Seleccionar Obra --</SelectItem>
                    {obras.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>
                        {o.prefijo ? `${o.prefijo} - ` : ""} {o.nombre}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </div>

              {/* VARIABLE */}
              <Select
                value={form.variableId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, variableId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Variable *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Seleccionar Variable --</SelectItem>
                  {variables.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* UBICACIÓN */}
              <Input
                placeholder="Ubicación *"
                value={form.ubicacion}
                onChange={(e) =>
                  setForm({ ...form, ubicacion: e.target.value })
                }
              />

              {/* CONTRATISTA */}
              <Select
                value={form.contratistaId || "none"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    contratistaId: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contratista (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Sin Contratista --</SelectItem>
                  {contratistas.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* MEDICIÓN */}
              <Select
                value={form.medicionId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, medicionId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Medición *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Seleccionar Medición --</SelectItem>
                  {mediciones.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* UNIDAD */}
              <Select
                value={form.unidadId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, unidadId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidad *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Seleccionar Unidad --</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* GPS + BOTONES */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col gap-2 p-2 border rounded-md bg-gray-50">
                <label className="text-xs font-semibold text-gray-500">Geolocalización</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isEditing}
                    onClick={() => !isEditing && getGeoLocation()}
                    className="flex-1 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                  >
                    <MapPin className="h-4 w-4 mr-2" /> Capturar GPS
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isEditing || !form.latitud || !form.longitud}
                    onClick={() => !isEditing && setMapOpen(true)}
                    className="flex-1 bg-white hover:bg-green-50 border-green-300 text-green-700"
                  >
                    <Map className="h-4 w-4 mr-2" /> Ver mapa
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input value={form.latitud} readOnly disabled={isEditing} placeholder="Latitud" className="bg-white" />
                  <Input value={form.longitud} readOnly disabled={isEditing} placeholder="Longitud" className="bg-white" />
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <Textarea
                    placeholder="Observaciones generales de la actividad..."
                    value={form.observaciones}
                    onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                    }
                    className="min-h-[80px]"
                />
              </div>

              {/* FECHAS CONDICIONALES */}
              {(isProductoNoConformeOrSeRecomienda || form.fechaMejora || form.fechaEjecucion) && (
                <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    {/* Fecha mejora */}
                    {isProductoNoConformeOrSeRecomienda && (
                    <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-1">
                        Fecha Compromiso / Mejora
                        </label>
                        <Input
                        type="date"
                        value={form.fechaMejora}
                        min={
                            form.fechaCreacion
                            ? form.fechaCreacion.split("T")[0]
                            : undefined
                        }
                        onChange={(e) =>
                            setForm({ ...form, fechaMejora: e.target.value })
                        }
                        className="bg-white"
                        />
                    </div>
                    )}

                    {/* Fecha ejecución */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Real de Ejecución
                    </label>
                    <Input
                        type="date"
                        value={form.fechaEjecucion}
                        min={
                        form.fechaCreacion
                            ? form.fechaCreacion.split("T")[0]
                            : undefined
                        }
                        onChange={(e) =>
                        setForm({ ...form, fechaEjecucion: e.target.value })
                        }
                        className="bg-white"
                    />
                    </div>
                </div>
              )}

              {/* ======================= */}
              {/* FOTOGRAFÍAS NORMALES   */}
              {/* ======================= */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotografías (máximo 3)
                </label>

                <div className="flex flex-wrap gap-3">

                  {/* --- EXISTENTES --- */}
                  {form.fotosExistentes.map((foto, idx) => (
                    <div
                      key={`exist-${idx}`}
                      className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                    >
                      <img
                        src={foto.url}
                        className="object-cover w-full h-full"
                        alt="Evidencia"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            fotosExistentes: form.fotosExistentes.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* --- NUEVAS --- */}
                  {form.fotoFiles.map((file, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="object-cover w-full h-full"
                        alt="Nueva evidencia"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            fotoFiles: form.fotoFiles.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* --- BOTÓN AGREGAR --- */}
                  {form.fotoFiles.length + form.fotosExistentes.length < 3 && (
                    <label className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:border-[#113a84] hover:text-[#113a84] hover:bg-blue-50 transition-colors">
                      <span className="text-xl md:text-2xl">📷</span>
                      <span className="text-[10px] md:text-xs text-center mt-1">Agregar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (
                            form.fotoFiles.length +
                              form.fotosExistentes.length >=
                            3
                          ) {
                            toast.error("Máximo 3 fotografías.");
                            return;
                          }

                          setForm({
                            ...form,
                            fotoFiles: [...form.fotoFiles, file],
                          });
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* ============================ */}
              {/* SEGUIMIENTO + FOTOS EXTRA     */}
              {/* ============================ */}
              {isProductoNoConformeOrSeRecomienda && (
                <div className="col-span-1 md:col-span-2 lg:col-span-4 p-3 bg-gray-50 rounded-md border border-gray-200 mt-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2">Seguimiento de Calidad</label>
                  <Textarea
                    placeholder="Describa el seguimiento realizado..."
                    value={form.seguimiento}
                    onChange={(e) =>
                      setForm({ ...form, seguimiento: e.target.value })
                    }
                    className="bg-white mb-4"
                  />

                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidencias de corrección (máximo 2)
                    </label>

                    <div className="flex flex-wrap gap-3">

                      {/* EXISTENTES */}
                      {form.fotosSeguimientoExistentes.map((foto, idx) => (
                        <div
                          key={`seg-exist-${idx}`}
                          className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                        >
                          <img
                            src={foto.url}
                            className="object-cover w-full h-full"
                            alt="Seguimiento"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                fotosSeguimientoExistentes:
                                  form.fotosSeguimientoExistentes.filter(
                                    (_, i) => i !== idx
                                  ),
                              })
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* NUEVAS */}
                      {form.fotosSeguimiento.map((file, idx) => (
                        <div
                          key={`seg-new-${idx}`}
                          className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            className="object-cover w-full h-full"
                            alt="Nuevo seguimiento"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                fotosSeguimiento:
                                  form.fotosSeguimiento.filter(
                                    (_, i) => i !== idx
                                  ),
                              })
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* AGREGAR */}
                      {form.fotosSeguimiento.length +
                        form.fotosSeguimientoExistentes.length <
                        2 && (
                        <label className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:border-[#113a84] hover:text-[#113a84] hover:bg-white transition-colors">
                          <span className="text-xl md:text-2xl">📷</span>
                          <span className="text-[10px] md:text-xs text-center mt-1">Agregar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const total =
                                form.fotosSeguimiento.length +
                                form.fotosSeguimientoExistentes.length;

                              if (total >= 2) {
                                toast.error("Máximo 2 fotografías.");
                                return;
                              }

                              setForm({
                                ...form,
                                fotosSeguimiento: [
                                  ...form.fotosSeguimiento,
                                  file,
                                ],
                              });
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-sm text-red-500 text-center mt-2 font-medium bg-red-50 p-2 rounded">{errorMsg}</p>
          )}

          <Button
            onClick={onSubmit}
            disabled={loading}
            className="mt-4 w-full md:w-auto bg-[#0C2D57] hover:bg-[#113a84] text-white font-bold py-3"
          >
            {loading
              ? "Guardando..."
              : isEditing
              ? "Guardar Cambios"
              : "Registrar Bitácora"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* MODAL MAPA */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="p-4 bg-gray-50 border-b">
            <DialogTitle>Ajustar ubicación GPS</DialogTitle>
          </DialogHeader>

          {form.latitud && form.longitud ? (
            <div className="w-full h-[300px] md:h-[400px]">
              <DynamicMap
                lat={parseFloat(form.latitud)}
                lng={parseFloat(form.longitud)}
                onPositionChange={(lat, lng) =>
                  setForm((prev) => ({
                    ...prev,
                    latitud: lat.toFixed(6),
                    longitud: lng.toFixed(6),
                  }))
                }
                onClose={() => setMapOpen(false)}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No hay coordenadas disponibles para mostrar el mapa.</p>
              <Button variant="outline" onClick={() => setMapOpen(false)} className="mt-4">
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}