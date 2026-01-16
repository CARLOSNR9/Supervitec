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
import { format } from "date-fns";
import { es } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0C2D57",
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: "column" },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0C2D57",
    textTransform: "uppercase",
  },
  subTitle: { fontSize: 9, color: "#666", marginTop: 2 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  infoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  infoCol: {
    width: "50%",
    marginBottom: 6,
    paddingRight: 5,
  },
  label: {
    fontSize: 7,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 1,
    fontWeight: "bold",
  },
  value: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
  },
  valueSmall: {
    fontSize: 8,
    color: "#555",
    marginTop: 1,
  },
  controlBox: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
    flexDirection: "row",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  controlCol: { width: "25%" },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0C2D57",
    marginBottom: 4,
    marginTop: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingBottom: 2,
  },
  textBox: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 9,
    lineHeight: 1.3,
    textAlign: "justify",
  },
  blueBox: { backgroundColor: "#eff6ff", borderColor: "#dbeafe", borderWidth: 1 },
  yellowBox: { backgroundColor: "#fefce8", borderColor: "#fef9c3", borderWidth: 1 },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 10,
  },
  photoWrapper: {
    width: "32%",
    height: 110,
    marginRight: "1.3%",
    marginBottom: 5,
    position: "relative",
    borderRadius: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 6,
    padding: 2,
    textAlign: "center",
  },
  correctionLabel: {
    backgroundColor: "#eab308",
    color: "#000",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 5,
  },
});

interface Props {
  data: Bitacora[];
}

export const BitacoraReportePDF = ({ data }: Props) => {
  
  // Helper para formatear fechas
  const formatDate = (dateString?: string | Date | null, withTime = false) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      // 'P' es fecha corta localizada, 'p' es hora localizada
      return format(d, withTime ? "dd/MM/yyyy h:mm a" : "dd/MM/yyyy", { locale: es });
    } catch (e) {
      return "-";
    }
  };

  return (
    <Document>
      {data.map((bitacora, index) => {
        
        const isNoConforme = bitacora.variable?.nombre?.toUpperCase().includes("NO_CONFORME") || 
                             bitacora.variable?.nombre?.toUpperCase().includes("NO CONFORME");

        return (
          <Page key={bitacora.id} size="A4" style={styles.page}>
            
            {/* === HEADER === */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>
                  BITÁCORA #{bitacora.id} {bitacora.codigo ? `| ${bitacora.codigo}` : ""}
                </Text>
                <Text style={styles.subTitle}>
                  Fecha Creación: {formatDate(bitacora.fechaCreacion, true)}
                </Text>
              </View>
              
              <View style={[
                  styles.statusBadge, 
                  { backgroundColor: bitacora.estado === 'ABIERTA' ? '#dcfce7' : '#fee2e2' }
                ]}>
                <Text style={{ color: bitacora.estado === 'ABIERTA' ? '#166534' : '#991b1b' }}>
                  {bitacora.estado}
                </Text>
              </View>
            </View>

            {/* === INFO GRID === */}
            <View style={styles.infoContainer}>
              <View style={styles.infoCol}>
                <Text style={styles.label}>RESPONSABLE</Text>
                <Text style={styles.value}>{bitacora.responsable?.nombreCompleto || "N/A"}</Text>
              </View>
              
              <View style={styles.infoCol}>
                <Text style={styles.label}>OBRA</Text>
                <Text style={styles.value}>{bitacora.obra?.nombre || "N/A"}</Text>
                <Text style={styles.valueSmall}>Prefijo: {bitacora.obra?.prefijo || "---"}</Text>
              </View>

              <View style={{ width: '100%', height: 4 }}></View>

              <View style={styles.infoCol}>
                <Text style={styles.label}>VARIABLE / TIPO</Text>
                <Text style={[styles.value, { color: isNoConforme ? '#b91c1c' : '#000' }]}>
                  {bitacora.variable?.nombre || "N/A"}
                </Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.label}>UBICACIÓN</Text>
                <Text style={styles.value}>{bitacora.ubicacion || "No registrada"}</Text>
                {bitacora.latitud && (
                   <Text style={styles.valueSmall}>GPS: {bitacora.latitud}, {bitacora.longitud}</Text>
                )}
              </View>
            </View>

            {/* === DATOS TÉCNICOS (CORREGIDO PARA MOSTRAR HORA) === */}
            <View style={styles.controlBox}>
              <View style={styles.controlCol}>
                <Text style={styles.label}>MEDICIÓN</Text>
                <Text style={styles.value}>{bitacora.medicion?.nombre || "-"}</Text>
              </View>
              <View style={styles.controlCol}>
                 <Text style={styles.label}>UNIDAD</Text>
                 <Text style={styles.value}>{bitacora.unidadRel?.nombre || "-"}</Text>
              </View>
              {/* ✅ AQUÍ ESTÁ EL CAMBIO: Se agrega ', true' para mostrar la hora */}
              <View style={styles.controlCol}>
                 <Text style={styles.label}>F. COMPROMISO</Text>
                 <Text style={[styles.value, { color: '#ea580c' }]}>
                   {formatDate(bitacora.fechaMejora, true)} 
                 </Text>
              </View>
              <View style={styles.controlCol}>
                 <Text style={styles.label}>F. EJECUCIÓN</Text>
                 <Text style={styles.value}>
                    {formatDate(bitacora.fechaEjecucion, true)}
                 </Text>
              </View>
            </View>

            {/* === 1. OBSERVACIONES === */}
            <View wrap={false}>
              <Text style={styles.sectionHeader}>1. OBSERVACIONES / HALLAZGO</Text>
              <View style={[styles.textBox, styles.blueBox]}>
                <Text>{bitacora.observaciones || "Sin observaciones registradas."}</Text>
              </View>

              <View style={styles.photoGrid}>
                {bitacora.evidencias?.map((foto, i) => (
                  <View key={i} style={styles.photoWrapper}>
                    <Image src={foto.url} style={styles.image} />
                    <Text style={styles.photoLabel}>
                      {formatDate(foto.createdAt || bitacora.fechaCreacion, true)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* === 2. SEGUIMIENTO === */}
            {(bitacora.seguimiento || (bitacora.evidenciasSeguimiento && bitacora.evidenciasSeguimiento.length > 0)) && (
              <View wrap={false} style={{ marginTop: 5 }}>
                <Text style={styles.sectionHeader}>2. SEGUIMIENTO DE CALIDAD / CORRECCIÓN</Text>
                
                <View style={[styles.textBox, styles.yellowBox]}>
                  <Text>{bitacora.seguimiento || "Sin descripción de seguimiento."}</Text>
                </View>

                <View style={styles.photoGrid}>
                  {bitacora.evidenciasSeguimiento?.map((foto, i) => (
                    <View key={i} style={[styles.photoWrapper, { borderColor: '#eab308', borderWidth: 1 }]}>
                        <Image src={foto.url} style={styles.image} />
                        <Text style={[styles.photoLabel, styles.correctionLabel]}>
                           CORRECCIÓN - {formatDate(foto.createdAt || bitacora.fechaCreacion, true)}
                        </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.footer}>
              Generado por SUPERVITEC PRO - {new Date().toLocaleString()} • Página {index + 1} de {data.length}
            </Text>

          </Page>
        );
      })}
    </Document>
  );
};