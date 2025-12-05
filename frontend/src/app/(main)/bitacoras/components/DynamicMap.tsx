"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DynamicMapProps {
  lat: number;
  lng: number;
  onPositionChange?: (lat: number, lng: number) => void;
  onClose?: () => void;
}

export default function DynamicMap({ lat, lng, onPositionChange }: DynamicMapProps) {
  // ✅ Usamos ref para el contenedor DIV en lugar de ID para evitar conflictos en React
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Crear mapa solo una vez
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Inicializamos el mapa sobre la referencia del DOM
    const map = L.map(mapContainerRef.current, {
      center: [lat || 0, lng || 0],
      zoom: 16,
      zoomControl: false, // Desactivamos el zoom por defecto para moverlo
    });

    mapRef.current = map;

    // Añadimos controles de zoom abajo a la derecha (mejor para móviles)
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    const redIcon = new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const marker = L.marker([lat || 0, lng || 0], {
      draggable: true,
      icon: redIcon,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", (e) => {
      const position = e.target.getLatLng();
      onPositionChange?.(position.lat, position.lng);
      // 🚀 MEJORA UX: Quitamos el onClose automático al soltar.
      // Es mejor que el usuario ajuste el pin con calma y cierre el modal manualmente.
    });

    // 🔧 TRUCO: Forzar ajuste de tamaño para evitar cuadros grises en Modals
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza posición cuando cambian lat/lng (por si se captura GPS de nuevo)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const map = mapRef.current;
    const marker = markerRef.current;
    const newPos = L.latLng(lat || 0, lng || 0);

    // Evitamos errores de animación si el mapa no está listo
    requestAnimationFrame(() => {
      try {
        marker.setLatLng(newPos);
        map.setView(newPos); // Centrar mapa en la nueva posición
      } catch (e) {
        console.warn("⚠️ Leaflet sync warning:", e);
      }
    });
  }, [lat, lng]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg border border-gray-200 z-0" 
      style={{ minHeight: "300px" }} // Altura mínima garantizada para móvil
    />
  );
}