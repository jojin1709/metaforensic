"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapPanel({ lat, lon }: { lat: number; lon: number }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Fix default marker icons breaking under bundlers safely inside client effect
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  return (
    <div className="h-72 w-full rounded-xl overflow-hidden border border-panelBorder relative z-0">
      <MapContainer
        center={[lat, lon]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={[lat, lon]} radius={80} pathOptions={{ color: "#FF4D3D", fillOpacity: 0.15 }} />
        <Marker position={[lat, lon]} />
      </MapContainer>
    </div>
  );
}
