// Capas de visualización del mapa de distribución: cambian automáticamente según el zoom.
export enum DistributionLayerType {
  RANGE = "range",
  POINTS = "points",
}

// Percentiles usados para descartar outliers extremos al calcular el bounding box de distribución.
export const BBOX_LOWER_PERCENTILE = 5;
export const BBOX_UPPER_PERCENTILE = 95;
export const MIN_POINTS_FOR_PERCENTILE_BBOX = 10;

// GBIF limita occurrence/search a 300 resultados por página; se pagina hasta este tope para range/points.
export const GBIF_PAGE_SIZE = 300;
export const GBIF_BULK_OCCURRENCE_LIMIT = 5000;

// Hull cóncavo (estilo IUCN): maxEdge adaptativo = ratio * diagonal del bbox, con un piso mínimo.
export const RANGE_MIN_POINTS = 3;
export const RANGE_MAX_EDGE_RATIO = 0.15;
export const RANGE_MIN_MAX_EDGE_KM = 50;
export const RANGE_SIMPLIFY_TOLERANCE_DEG = 0.01;

// Con <3 puntos (o si el hull falla igualmente) no hay suficientes vértices para un hull:
// en vez de devolver null, se dibuja un pequeño círculo por punto para no perder el dato real.
export const RANGE_SPARSE_BUFFER_KM = 20;
