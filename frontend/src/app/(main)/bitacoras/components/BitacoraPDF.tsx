import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Bitacora } from '../../types/bitacora';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registramos una fuente estándar (Helvetica viene por defecto, pero esto es por si quieres custom)
// Font.register({ family: 'Roboto', src: '...' }); 

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0C2D57',
    paddingBottom: 5,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2D57',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    padding: 4,
    backgroundColor: '#eee', // Color base, lo cambiamos dinámicamente
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // --- INFO GRID (Responsable, Obra, etc) ---
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoCol: {
    width: '50%', // 2 Columnas
    marginBottom: 6,
  },
  label: {
    fontSize: 8,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  valueSmall: {
    fontSize: 8,
    color: '#555',
  },
  
  // --- DATOS CONTROL (Caja Gris) ---
  controlBox: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
    marginBottom: 15,
  },
  controlCol: {
    width: '25%', // 4 columnas
  },
  
  // --- SECCIONES (Observaciones / Seguimiento) ---
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2D57',
    marginBottom: 4,
    marginTop: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingBottom: 2,
  },
  textBox: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  blueBox: { backgroundColor: '#eff6ff' }, // Azulito claro
  yellowBox: { backgroundColor: '#fefce8' }, // Amarillito claro

  // --- FOTOS ---
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5, // React-PDF a veces ignora gap, usaremos margin
    marginBottom: 10,
  },
  photoContainer: {
    width: '32%', // 3 fotos por fila (aprox)
    height: 100,  // Altura fija para uniformidad
    marginRight: '1%',
    marginBottom: 5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 4,
  },
  photoDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 6,
    padding: 2,
    textAlign: 'center',
  },
  
  // --- FOOTER ---
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
  },
});

interface BitacoraPDFProps {
  data: Bitacora;
}

const BitacoraPDF: React.FC<BitacoraPDFProps> = ({ data }) => {
  
  // Helpers
  const formatDate = (dateString?: string | Date | null, withTime = false) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), withTime ? "dd/MM/yyyy HH:mm aa" : "dd/MM/yyyy", { locale: es });
    } catch (e) { return dateString.toString(); }
  };

  const isNoConforme = data.variable?.nombre?.toUpperCase().includes('NO_CONFORME') || 
                       data.variable?.nombre?.toUpperCase().includes('NO CONFORME');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === HEADER === */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              BITÁCORA #{data.id} {data.codigo ? `| ${data.codigo}` : ''}
            </Text>
            <Text style={styles.subTitle}>
              Reporte Generado: {format(new Date(), "dd/MM/yyyy HH:mm aa", { locale: es })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: data.estado === 'ABIERTA' ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={{ color: data.estado === 'ABIERTA' ? '#166534' : '#991b1b' }}>
              {data.estado}
            </Text>
          </View>
        </View>

        {/* === INFO GRID (2 Columnas) === */}
        <View style={styles.infoGrid}>
          {/* Fila 1 */}
          <View style={styles.infoCol}>
            <Text style={styles.label}>Responsable</Text>
            <Text style={styles.value}>{data.responsable?.nombreCompleto || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Obra</Text>
            <Text style={styles.value}>{data.obra?.nombre || 'N/A'}</Text>
            <Text style={styles.valueSmall}>Prefijo: {data.obra?.prefijo || '---'}</Text>
          </View>
          
          {/* Fila 2 (espacio) */}
          <View style={{ width: '100%', height: 6 }}></View>

          <View style={styles.infoCol}>
            <Text style={styles.label}>Variable / Tipo</Text>
            <Text style={[styles.value, { color: isNoConforme ? '#b91c1c' : '#000' }]}>
              {data.variable?.nombre || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Ubicación</Text>
            <Text style={styles.value}>{data.ubicacion || 'Sin registrar'}</Text>
            {data.latitud && (
               <Text style={styles.valueSmall}>GPS: {data.latitud}, {data.longitud}</Text>
            )}
          </View>
        </View>

        {/* === DATOS DE CONTROL (Caja Gris - 4 Columnas) === */}
        <View style={styles.controlBox}>
          <View style={styles.controlCol}>
            <Text style={styles.label}>Medición</Text>
            <Text style={styles.value}>{data.medicion?.nombre || '-'}</Text>
          </View>
          <View style={styles.controlCol}>
             <Text style={styles.label}>Unidad</Text>
             <Text style={styles.value}>{data.unidadRel?.nombre || '-'}</Text>
          </View>
          <View style={styles.controlCol}>
             <Text style={styles.label}>F. Compromiso</Text>
             <Text style={[styles.value, { color: '#ea580c' }]}>
               {formatDate(data.fechaMejora)}
             </Text>
          </View>
          <View style={styles.controlCol}>
             <Text style={styles.label}>F. Ejecución</Text>
             <Text style={styles.value}>{formatDate(data.fechaEjecucion)}</Text>
          </View>
        </View>

        {/* === OBSERVACIONES / HALLAZGO === */}
        <Text style={styles.sectionHeader}>1. OBSERVACIONES / HALLAZGO</Text>
        <View style={[styles.textBox, styles.blueBox]}>
          <Text>{data.observaciones || 'Sin observaciones registradas.'}</Text>
        </View>

        {/* FOTOS OBSERVACIONES (Grilla Horizontal) */}
        <View style={styles.photoGrid}>
          {data.evidencias?.map((foto, index) => (
             <View key={index} style={styles.photoContainer}>
                {/* Usamos una imagen de placeholder si falla, pero react-pdf suele manejar bien las urls */}
                <Image src={foto.url} style={styles.image} />
                <Text style={styles.photoDate}>
                    {formatDate(foto.createdAt || data.fechaCreacion, true)}
                </Text>
             </View>
          ))}
        </View>


        {/* === SEGUIMIENTO / CIERRE (Solo si existe) === */}
        {(data.seguimiento || (data.evidenciasSeguimiento && data.evidenciasSeguimiento.length > 0)) && (
          <View wrap={false}> {/* Intentar no romper esta sección entre páginas */}
            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>2. SEGUIMIENTO DE CALIDAD / CORRECCIÓN</Text>
            
            <View style={[styles.textBox, styles.yellowBox]}>
              <Text>{data.seguimiento || 'Sin descripción de seguimiento.'}</Text>
            </View>

            {/* FOTOS SEGUIMIENTO (Grilla Horizontal) */}
            <View style={styles.photoGrid}>
              {data.evidenciasSeguimiento?.map((foto, index) => (
                <View key={index} style={[styles.photoContainer, { borderColor: '#eab308', borderWidth: 1 }]}>
                    <Image src={foto.url} style={styles.image} />
                    <View style={[styles.photoDate, { backgroundColor: '#eab308' }]}>
                       <Text style={{ color: '#000', fontWeight: 'bold' }}>CORRECCIÓN</Text>
                    </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* === FOOTER === */}
        <View style={styles.footer}>
          <Text>
            Reporte generado automáticamente por SUPERVITEC PRO | {format(new Date(), "yyyy")}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default BitacoraPDF;