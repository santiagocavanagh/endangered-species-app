// Capas de visualización del mapa de distribución; el cambio entre ellas es automático según el zoom.
export enum DistributionLayerType {
  RANGE = "range",
  POINTS = "points",
}

// Límite de zoom (Leaflet) que gobierna la transición automática RANGE -> POINTS.
export const DISTRIBUTION_ZOOM_BREAKPOINTS = {
  pointsMinZoom: 11,
} as const;

export function resolveLayerForZoom(zoom: number): DistributionLayerType {
  return zoom >= DISTRIBUTION_ZOOM_BREAKPOINTS.pointsMinZoom
    ? DistributionLayerType.POINTS
    : DistributionLayerType.RANGE;
}
