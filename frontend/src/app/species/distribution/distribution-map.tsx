import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  ScaleControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import type { SpeciesDistribution } from "../../../services/api";
import { ViewportManager } from "./viewport-manager";
import { RangeLayer } from "./range-layer";
import { ClusterLayer } from "./cluster-layer";
import { MapErrorBoundary } from "./map-error-boundary";
import {
  DistributionLayerType,
  resolveLayerForZoom,
} from "./distribution.types";

const WORLD_ZOOM = 1;
// Espera a que el zoom se estabilice antes de cambiar de capa: evita montar/desmontar
// RangeLayer/ClusterLayer en cada paso cuando el usuario hace zoom muchas veces seguidas.
const ZOOM_DEBOUNCE_MS = 300;
// Debe superar DISTRIBUTION_ZOOM_BREAKPOINTS.pointsMinZoom; de lo contrario la capa de puntos es inalcanzable.
const MAX_MAP_ZOOM = 16;
const ESRI_ATTRIBUTION = "Esri, HERE, Garmin, USGS, NGA";

interface DistributionMapProps {
  speciesId: number;
  distribution: SpeciesDistribution | null;
  loading: boolean;
}

// Orquesta el mapa de distribución: viewport inteligente (ViewportManager) + cambio automático
// entre el polígono de rango (estilo IUCN) y los clusters de ocurrencias según el zoom activo.
export function DistributionMap({
  speciesId,
  distribution,
  loading,
}: DistributionMapProps) {
  const [zoom, setZoom] = useState(WORLD_ZOOM);
  const [debouncedZoom, setDebouncedZoom] = useState(WORLD_ZOOM);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedZoom(zoom), ZOOM_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [zoom]);

  const activeLayer = resolveLayerForZoom(debouncedZoom);

  return (
    <article className="w-full">
      <div className="w-full aspect-square rounded-xl overflow-hidden border bg-white relative isolate">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : distribution?.hasData ? (
          <MapErrorBoundary key={speciesId}>
            <MapContainer
              key={speciesId}
              center={[20, 0]}
              zoom={2}
              zoomSnap={0.5}
              zoomDelta={0.5}
              minZoom={1}
              maxZoom={MAX_MAP_ZOOM}
              maxBounds={[
                [-90, -180],
                [90, 180],
              ]}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Topográfico">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                    attribution={ESRI_ATTRIBUTION}
                    maxZoom={18}
                    noWrap={true}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satélite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution={ESRI_ATTRIBUTION}
                    maxZoom={18}
                    noWrap={true}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Calles (OSM)">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="OpenStreetMap"
                    noWrap={true}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <ScaleControl position="bottomleft" imperial={false} />
              <ViewportManager
                distribution={distribution}
                onZoomChange={setZoom}
              />
              {activeLayer === DistributionLayerType.RANGE && (
                <RangeLayer speciesId={speciesId} />
              )}
              {activeLayer === DistributionLayerType.POINTS && (
                <ClusterLayer speciesId={speciesId} />
              )}
            </MapContainer>
          </MapErrorBoundary>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50 text-center p-4">
            <MapPin size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500">
              {distribution?.reason === "no_gbif_reference"
                ? "Sin identificador externo asociado a esta especie."
                : "No hay registros geográficos disponibles para esta especie."}
            </p>
          </div>
        )}
      </div>
      {distribution?.hasData && distribution.attribution && (
        <p className="text-xs text-gray-400 mt-1.5 text-right">
          {distribution.attribution}
          {distribution.occurrenceCount != null &&
            ` · ${distribution.occurrenceCount.toLocaleString("es-ES")} registros`}
        </p>
      )}
    </article>
  );
}
