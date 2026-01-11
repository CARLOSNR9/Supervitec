/* src/app/(main)/bitacoras/components/BitacoraPDF.tsx */

import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Bitacora } from "../types/bitacora";

// Estilos profesionales (se mantienen igual)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#333" },
  // Cabecera
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#0C2D57",
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "column" },
  headerRight: { flexDirection: "column", alignItems: "flex-end" },
  companyName: { fontSize: 18, fontWeight: "bold", color: "#0C2D57" },
  reportTitle: { fontSize: 14, marginTop: 5, color: "#666" },

  // Tabla de Info
  section: { marginVertical: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    padding: 5,
    marginBottom: 5,
    color: "#0C2D57",
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: "30%", fontWeight: "bold", color: "#555" },
  value: { width: "70%" },

  // Caja de observaciones
  box: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 10,
    minHeight: 40,
    borderRadius: 4,
  },

  // Imágenes
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
  imageContainer: { width: "30%", height: 100, marginBottom: 10 }, // 3 por fila
  image: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

// ✅ CAMBIO 1: La interfaz ahora espera un ARRAY
interface Props {
  data: Bitacora[]; 
}

// ✅ CAMBIO 2: El componente ahora itera sobre el array
export const BitacoraReportePDF = ({ data }: Props) => {
  return (
    <Document>
      {/* Generamos una página por cada bitácora en el array */}
      {data.map((bitacora, index) => {
        
        const responsableNombre =
          bitacora.responsable?.nombreCompleto?.trim()
            ? bitacora.responsable.nombreCompleto
            : "N/A";

        return (
          <Page key={bitacora.id} size="A4" style={styles.page}>
            {/* CABECERA */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.companyName}>SUPERVITEC</Text>
                <Text style={styles.reportTitle}>Reporte de Bitácora</Text>
              </View>
              <View style={styles.headerRight}>
                <Text>Folio: #{bitacora.id}</Text>
                <Text>
                  Fecha:{" "}
                  {bitacora.fechaCreacion
                    ? new Date(bitacora.fechaCreacion).toLocaleDateString()
                    : "N/A"}
                </Text>
                <Text>Estado: {bitacora.estado ?? "N/A"}</Text>
              </View>
            </View>

            {/* DATOS GENERALES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INFORMACIÓN DE OBRA</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Obra:</Text>
                <Text style={styles.value}>{bitacora.obra?.nombre ?? "N/A"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Responsable:</Text>
                <Text style={styles.value}>{responsableNombre}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Ubicación:</Text>
                <Text style={styles.value}>
                  {bitacora.ubicacion || "No registrada"}
                </Text>
              </View>

              {bitacora.contratista && (
                <View style={styles.row}>
                  <Text style={styles.label}>Contratista:</Text>
                  <Text style={styles.value}>{bitacora.contratista.nombre}</Text>
                </View>
              )}
            </View>

            {/* DATOS TÉCNICOS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DETALLES TÉCNICOS</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Variable:</Text>
                <Text style={styles.value}>
                  {bitacora.variable?.nombre ?? "N/A"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Medición:</Text>
                <Text style={styles.value}>
                  {bitacora.medicion?.nombre ?? "N/A"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Unidad:</Text>
                <Text style={styles.value}>
                  {bitacora.unidadRel?.nombre ?? "N/A"}
                </Text>
              </View>
            </View>

            {/* OBSERVACIONES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
              <View style={styles.box}>
                <Text>{bitacora.observaciones || "Sin observaciones."}</Text>
              </View>
            </View>

            {/* FOTOS */}
            {bitacora.evidencias && bitacora.evidencias.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>EVIDENCIA FOTOGRÁFICA</Text>
                <View style={styles.gallery}>
                  {bitacora.evidencias.map((foto, i) => (
                    <View key={i} style={styles.imageContainer}>
                      <Image src={foto.url} style={styles.image} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SEGUIMIENTO (Si aplica) */}
            {bitacora.seguimiento && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SEGUIMIENTO / CIERRE</Text>

                <View style={styles.box}>
                  <Text>{bitacora.seguimiento}</Text>
                </View>

                {bitacora.evidenciasSeguimiento &&
                  bitacora.evidenciasSeguimiento.length > 0 && (
                    <View style={{ ...styles.gallery, marginTop: 10 }}>
                      {bitacora.evidenciasSeguimiento.map((foto, i) => (
                        <View key={i} style={styles.imageContainer}>
                          <Image src={foto.url} style={styles.image} />
                        </View>
                      ))}
                    </View>
                  )}
              </View>
            )}

            {/* PIE DE PÁGINA (Con numeración) */}
            <Text style={styles.footer}>
              Generado por Plataforma SuperviTEC - {new Date().toLocaleString()} •
              Página {index + 1} de {data.length}
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};