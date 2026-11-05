import L from "leaflet";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { STATUS_META } from "@/lib/constants";
import type { Report } from "@/types";

const pin = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });

const TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = "© OpenStreetMap contributors";

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), 15)); }, [center[0], center[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function MapPickerInner({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full">
      <TileLayer url={TILE} attribution={ATTR} />
      <ClickHandler onPick={onChange} />
      <Recenter center={[lat, lng]} />
      <Marker
        position={[lat, lng]}
        draggable
        icon={pin("#16a34a")}
        eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(p.lat, p.lng); } }}
      />
    </MapContainer>
  );
}

export function MapViewInner({ lat, lng, color = "#16a34a" }: { lat: number; lng: number; color?: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer url={TILE} attribution={ATTR} />
      <Marker position={[lat, lng]} icon={pin(color)} />
    </MapContainer>
  );
}

function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap();
  useEffect(() => {
    if (!reports.length) return;
    map.fitBounds(L.latLngBounds(reports.map((r) => [r.latitude, r.longitude])), { padding: [40, 40] });
  }, [reports.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function ReportsMapInner({ reports }: { reports: Report[] }) {
  return (
    <MapContainer center={[-6.9, 109.5]} zoom={6} className="h-full w-full">
      <TileLayer url={TILE} attribution={ATTR} />
      <FitBounds reports={reports} />
      {reports.map((r) => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={pin(STATUS_META[r.status].hex)}>
          <Popup minWidth={220}>
            <div className="w-[220px] space-y-2">
              {r.photo_url && <img src={r.photo_url} alt={r.title} className="h-24 w-full rounded-md object-cover" />}
              <p className="text-sm font-semibold leading-snug">{r.title}</p>
              <div className="flex flex-wrap gap-1"><StatusBadge status={r.status} /><CategoryBadge category={r.category} /></div>
              <Link to="/reports/$id" params={{ id: String(r.id) }} className="text-xs font-semibold text-primary">Lihat detail →</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
