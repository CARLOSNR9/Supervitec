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

export default function DynamicMap({ lat, lng, onPositionChange, onClose }: DynamicMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Crear mapa solo una vez
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("dynamic-map", {
      center: [lat || 0, lng || 0],
      zoom: 16,
    });

    mapRef.current = map;

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
      if (onClose) setTimeout(() => onClose(), 300);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Actualiza posición cuando cambian lat/lng
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const map = mapRef.current;
    const marker = markerRef.current;
    const newPos = L.latLng(lat || 0, lng || 0);

    // Usa try-catch + timeout para evitar error '_leaflet_pos'
    setTimeout(() => {
      try {
        marker.setLatLng(newPos);
        map.setView(newPos);
      } catch (e) {
        console.warn("⚠️ Leaflet aún no listo:", e);
      }
    }, 50);
  }, [lat, lng]);

  return <div id="dynamic-map" className="w-full h-full rounded-lg" />;
}
