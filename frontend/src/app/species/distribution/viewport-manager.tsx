import { useEffect, useRef } from "react";
import { useMap, useMapEvent } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { SpeciesDistribution } from "../../../services/api";

const WORLD_CENTER: [number, number] = [10, 0];
const WORLD_ZOOM = 1;
const SINGLE_POINT_ZOOM = 6;
const FIT_BOUNDS_PADDING: [number, number] = [24, 24];
const FIT_BOUNDS_MAX_ZOOM = 10;

interface ViewportManagerProps {
  distribution: SpeciesDistribution | null;
  onZoomChange: (zoom: number) => void;
}

// Viewport inteligente: fitBounds (padding/maxZoom/animate) sobre el bbox por percentiles,
// centrado directo si es un único punto, y el fallback mundial cuando no hay datos.
// También reporta el zoom activo para que DistributionMap decida qué capa mostrar.
export function ViewportManager({
  distribution,
  onZoomChange,
}: ViewportManagerProps) {
  const map = useMap();
  const appliedForRef = useRef<number | null>(null);

  useMapEvent("zoomend", () => {
    onZoomChange(map.getZoom());
  });

  useEffect(() => {
    const speciesId = distribution?.speciesId ?? null;
    if (appliedForRef.current === speciesId) {
      return;
    }
    appliedForRef.current = speciesId;

    const bbox = distribution?.bbox;
    try {
      if (!distribution?.hasData || !bbox) {
        map.setView(WORLD_CENTER, WORLD_ZOOM, { animate: true });
        return;
      }

      const isSinglePoint =
        bbox.minLat === bbox.maxLat && bbox.minLng === bbox.maxLng;

      if (isSinglePoint) {
        map.setView([bbox.minLat, bbox.minLng], SINGLE_POINT_ZOOM, {
          animate: true,
        });
      } else {
        const bounds: LatLngBoundsExpression = [
          [bbox.minLat, bbox.minLng],
          [bbox.maxLat, bbox.maxLng],
        ];
        map.fitBounds(bounds, {
          padding: FIT_BOUNDS_PADDING,
          maxZoom: FIT_BOUNDS_MAX_ZOOM,
          animate: true,
        });
      }
    } catch (error) {
      // Un fitBounds/setView inválido no debe tumbar el mapa completo.
      console.error("No se pudo ajustar el viewport del mapa:", error);
    } finally {
      onZoomChange(map.getZoom());
    }
  }, [distribution, map, onZoomChange]);

  return null;
}
