import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type { Feature } from "geojson";
import { api } from "../../../services/api";
import type { RangeGeometry } from "../../../services/api";

interface RangeLayerProps {
  speciesId: number;
}

// Relleno sólido semitransparente, similar al estilo de los mapas de rango de IUCN Red List.
const RANGE_STYLE: PathOptions = {
  color: "#b45309",
  weight: 1.5,
  fillColor: "#f59e0b",
  fillOpacity: 0.55,
};

const rangeCache = new Map<number, RangeGeometry | null>();

// Polígono de distribución (hull sobre ocurrencias GBIF) estilo IUCN; capa por defecto en zoom 0-10.
export function RangeLayer({ speciesId }: RangeLayerProps) {
  const [geometry, setGeometry] = useState<RangeGeometry | null>(
    rangeCache.get(speciesId) ?? null,
  );

  useEffect(() => {
    if (rangeCache.has(speciesId)) {
      return;
    }
    let cancelled = false;

    api.fetchSpeciesRange(speciesId).then((res) => {
      if (cancelled) {
        return;
      }
      const value = res?.geometry ?? null;
      rangeCache.set(speciesId, value);
      setGeometry(value);
    });

    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  if (!geometry) {
    return null;
  }

  const feature: Feature = { type: "Feature", properties: {}, geometry };

  return (
    <GeoJSON
      // react-leaflet no re-dibuja GeoJSON al cambiar `data`; la key fuerza el remount con la nueva geometría.
      key={`${speciesId}-${geometry.type}`}
      data={feature}
      style={RANGE_STYLE}
    />
  );
}
