import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import * as L from "leaflet";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { api } from "../../../services/api";
import type { OccurrencePoint } from "../../../services/api";

interface ClusterLayerProps {
  speciesId: number;
}

const occurrencePointsCache = new Map<number, OccurrencePoint[]>();

// react-leaflet-cluster ya no configura los íconos default de Leaflet; se hace una única vez.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type DisplayField =
  | "dataset"
  | "country"
  | "eventDate"
  | "basisOfRecord"
  | "publisher";

const FIELD_LABELS: Array<[DisplayField, string]> = [
  ["dataset", "Dataset"],
  ["country", "País"],
  ["eventDate", "Fecha"],
  ["basisOfRecord", "Tipo de registro"],
  ["publisher", "Editor"],
];

// Clusters de ocurrencias individuales (react-leaflet-cluster); solo se solicitan con zoom >= 11.
export function ClusterLayer({ speciesId }: ClusterLayerProps) {
  const [points, setPoints] = useState<OccurrencePoint[]>(
    occurrencePointsCache.get(speciesId) ?? [],
  );

  useEffect(() => {
    if (occurrencePointsCache.has(speciesId)) {
      return;
    }
    let cancelled = false;

    api.fetchSpeciesOccurrencePoints(speciesId).then((res) => {
      if (cancelled || !res) {
        return;
      }
      occurrencePointsCache.set(speciesId, res.points);
      setPoints(res.points);
    });

    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  return (
    <MarkerClusterGroup chunkedLoading>
      {points.map((point) => (
        <Marker key={point.key} position={[point.lat, point.lng]}>
          <Popup>
            <div className="text-xs space-y-1">
              {FIELD_LABELS.map(([field, label]) =>
                point[field] ? (
                  <p key={field}>
                    <span className="font-semibold">{label}:</span>{" "}
                    {point[field]}
                  </p>
                ) : null,
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}
