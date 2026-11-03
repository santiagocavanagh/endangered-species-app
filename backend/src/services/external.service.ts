import axios from "axios";
import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import { AppDataSource } from "../config/data.source";
import { ENV } from "../config/env.config";
import { Species } from "../entities/species.entity";
import {
  ExternalProvider,
  MatchStatus,
  SpeciesExternalRef,
} from "../entities/species-ref.entity";
import { NotFoundError } from "../errors/http.error";
import {
  BBOX_LOWER_PERCENTILE,
  BBOX_UPPER_PERCENTILE,
  DistributionLayerType,
  GBIF_BULK_OCCURRENCE_LIMIT,
  GBIF_PAGE_SIZE,
  MIN_POINTS_FOR_PERCENTILE_BBOX,
  RANGE_MAX_EDGE_RATIO,
  RANGE_MIN_MAX_EDGE_KM,
  RANGE_MIN_POINTS,
  RANGE_SIMPLIFY_TOLERANCE_DEG,
  RANGE_SPARSE_BUFFER_KM,
} from "../constants/distribution.constant";

const HTTP_TIMEOUT_MS = 15_000;
const GBIF_AUTO_CONFIDENCE = 90;
const IUCN_AUTO_CONFIDENCE = 95;

interface MatchCandidate {
  externalId: string | null;
  matchedName: string | null;
  confidence: number | null;
  status: MatchStatus;
  meta: Record<string, unknown> | null;
  reason: string | null;
}

export interface ProviderSyncResult {
  provider: ExternalProvider;
  status: MatchStatus;
  externalId: string | null;
  matchedName: string | null;
  confidence: number | null;
  persisted: boolean;
  reason: string | null;
  meta: Record<string, unknown> | null;
}

export interface SpeciesExternalSyncResult {
  speciesId: number;
  scientificName: string;
  providers: ProviderSyncResult[];
}

export interface ExternalBatchSyncOptions {
  limit?: number;
  offset?: number;
  delayMs?: number;
}

export interface ExternalBatchSyncError {
  speciesId: number;
  scientificName: string;
  reason: string;
}

export interface ExternalBatchSyncResult {
  limit: number;
  offset: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: SpeciesExternalSyncResult[];
  errors: ExternalBatchSyncError[];
}

interface GbifBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface GbifCoverageMeta {
  hasCoordinates: boolean;
  occurrenceCount: number;
  validatedAt: string;
  bbox: GbifBoundingBox | null;
}

export interface SpeciesDistributionDTO {
  speciesId: number;
  scientificName: string;
  provider: ExternalProvider | null;
  matchStatus: MatchStatus | null;
  externalId: string | null;
  hasData: boolean;
  occurrenceCount: number | null;
  bbox: GbifBoundingBox | null;
  attribution: string | null;
  lastValidatedAt: string | null;
  reason: string | null;
}

export interface RangePolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface RangeMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type RangeGeometry = RangePolygon | RangeMultiPolygon;

interface CachedRange {
  geometry: RangeGeometry | null;
  sourceCount: number;
  fetchedAt: string;
}

export interface SpeciesRangeDTO {
  speciesId: number;
  layer: DistributionLayerType.RANGE;
  hasData: boolean;
  geometry: RangeGeometry | null;
  sourceCount: number;
  cachedAt: string | null;
  reason: string | null;
}

export interface OccurrencePoint {
  key: string;
  lat: number;
  lng: number;
  dataset: string | null;
  country: string | null;
  eventDate: string | null;
  basisOfRecord: string | null;
  publisher: string | null;
}

interface CachedOccurrencePoints {
  points: OccurrencePoint[];
  count: number;
  fetchedAt: string;
}

export interface SpeciesOccurrencePointsDTO {
  speciesId: number;
  layer: DistributionLayerType.POINTS;
  hasData: boolean;
  points: OccurrencePoint[];
  count: number;
  cachedAt: string | null;
  reason: string | null;
}

interface GbifMatchResponse {
  usageKey?: number;
  speciesKey?: number;
  scientificName?: string;
  canonicalName?: string;
  confidence?: number;
  rank?: string;
  status?: string;
  matchType?: string;
}

export class ExternalService {
  private speciesRepo = AppDataSource.getRepository(Species);
  private refRepo = AppDataSource.getRepository(SpeciesExternalRef);

  // syncronize found species reference with species ref entity
  async syncSpeciesReferences(
    speciesId: number,
  ): Promise<SpeciesExternalSyncResult> {
    const species = await this.speciesRepo.findOneBy({ id: speciesId });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    return this.syncSpeciesReferencesEntity(species.id, species.scientificName);
  }

  async getSpeciesDistribution(
    speciesId: number,
  ): Promise<SpeciesDistributionDTO> {
    const species = await this.getSpeciesOrThrow(speciesId);
    const gbifRef = await this.resolveGbifRef(species);

    if (
      !gbifRef ||
      !gbifRef.externalId ||
      gbifRef.matchStatus === MatchStatus.NOT_FOUND
    ) {
      return {
        speciesId: species.id,
        scientificName: species.scientificName,
        provider: null,
        matchStatus: gbifRef?.matchStatus ?? null,
        externalId: null,
        hasData: false,
        occurrenceCount: null,
        bbox: null,
        attribution: null,
        lastValidatedAt: null,
        reason: "no_gbif_reference",
      };
    }

    let coverage = this.readGbifCoverage(gbifRef.meta);

    if (!coverage) {
      coverage = await this.fetchGbifCoverage(gbifRef.externalId);

      if (coverage) {
        await this.mergeRefMeta(gbifRef, "coverage", coverage);
      }
    }

    const hasData = coverage?.hasCoordinates ?? false;

    return {
      speciesId: species.id,
      scientificName: species.scientificName,
      provider: ExternalProvider.GBIF,
      matchStatus: gbifRef.matchStatus,
      externalId: gbifRef.externalId,
      hasData,
      occurrenceCount: coverage?.occurrenceCount ?? null,
      bbox: coverage?.bbox ?? null,
      attribution: hasData ? "Datos de distribución: GBIF.org" : null,
      lastValidatedAt: coverage?.validatedAt ?? null,
      reason: hasData ? null : "no_georeferenced_occurrences",
    };
  }

  // Polígono de rango (hull cóncavo sobre ocurrencias GBIF, estilo IUCN), cacheado en meta.range.
  async getSpeciesRange(speciesId: number): Promise<SpeciesRangeDTO> {
    const species = await this.getSpeciesOrThrow(speciesId);
    const gbifRef = await this.resolveGbifRef(species);

    if (
      !gbifRef ||
      !gbifRef.externalId ||
      gbifRef.matchStatus === MatchStatus.NOT_FOUND
    ) {
      return {
        speciesId: species.id,
        layer: DistributionLayerType.RANGE,
        hasData: false,
        geometry: null,
        sourceCount: 0,
        cachedAt: null,
        reason: "no_gbif_reference",
      };
    }

    let cached = this.readCachedRange(gbifRef.meta);

    if (!cached) {
      const results = await this.fetchGbifOccurrencesBulk(
        gbifRef.externalId,
        GBIF_BULK_OCCURRENCE_LIMIT,
      );
      const points = this.extractValidCoordinates(results);
      const geometry = this.computeRangeGeometry(points);

      cached = {
        geometry,
        sourceCount: points.length,
        fetchedAt: new Date().toISOString(),
      };
      await this.mergeRefMeta(gbifRef, "range", cached);
    }

    return {
      speciesId: species.id,
      layer: DistributionLayerType.RANGE,
      hasData: cached.geometry !== null,
      geometry: cached.geometry,
      sourceCount: cached.sourceCount,
      cachedAt: cached.fetchedAt,
      reason: cached.geometry !== null ? null : "no_georeferenced_occurrences",
    };
  }

  // Ocurrencias individuales con metadata (dataset/país/fecha/tipo/publisher) para clusters; cacheadas en meta.points.
  async getSpeciesOccurrencePoints(
    speciesId: number,
  ): Promise<SpeciesOccurrencePointsDTO> {
    const species = await this.getSpeciesOrThrow(speciesId);
    const gbifRef = await this.resolveGbifRef(species);

    if (
      !gbifRef ||
      !gbifRef.externalId ||
      gbifRef.matchStatus === MatchStatus.NOT_FOUND
    ) {
      return {
        speciesId: species.id,
        layer: DistributionLayerType.POINTS,
        hasData: false,
        points: [],
        count: 0,
        cachedAt: null,
        reason: "no_gbif_reference",
      };
    }

    let cached = this.readCachedOccurrencePoints(gbifRef.meta);

    if (!cached) {
      const results = await this.fetchGbifOccurrencesBulk(
        gbifRef.externalId,
        GBIF_BULK_OCCURRENCE_LIMIT,
      );
      const points = results
        .map((record) => this.toOccurrencePoint(record))
        .filter((point): point is OccurrencePoint => point !== null);

      cached = {
        points,
        count: points.length,
        fetchedAt: new Date().toISOString(),
      };
      await this.mergeRefMeta(gbifRef, "points", cached);
    }

    return {
      speciesId: species.id,
      layer: DistributionLayerType.POINTS,
      hasData: cached.count > 0,
      points: cached.points,
      count: cached.count,
      cachedAt: cached.fetchedAt,
      reason: cached.count > 0 ? null : "no_georeferenced_occurrences",
    };
  }

  private async getSpeciesOrThrow(speciesId: number): Promise<Species> {
    const species = await this.speciesRepo.findOne({
      where: { id: speciesId },
      relations: ["externalRefs"],
    });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    return species;
  }

  // Reutiliza la referencia GBIF existente o dispara un match perezoso si la especie nunca fue sincronizada.
  private async resolveGbifRef(
    species: Species,
  ): Promise<SpeciesExternalRef | undefined> {
    let gbifRef = species.externalRefs?.find(
      (ref) => ref.provider === ExternalProvider.GBIF,
    );

    if (!gbifRef) {
      await this.syncGbifReference(species.id, species.scientificName);
      gbifRef =
        (await this.refRepo.findOneBy({
          speciesId: species.id,
          provider: ExternalProvider.GBIF,
        })) ?? undefined;
    }

    return gbifRef;
  }

  // Persiste una clave de cache (coverage | range | points) sin pisar las demás.
  private async mergeRefMeta(
    ref: SpeciesExternalRef,
    key: "coverage" | "range" | "points",
    value: unknown,
  ): Promise<void> {
    ref.meta = { ...(ref.meta ?? {}), [key]: value };
    await this.refRepo.save(ref);
  }

  async syncBatchSpeciesReferences(
    options: ExternalBatchSyncOptions = {},
  ): Promise<ExternalBatchSyncResult> {
    const limit = this.toPositiveInt(options.limit, 50);
    const offset = this.toNonNegativeInt(options.offset, 0);
    const delayMs = this.toNonNegativeInt(options.delayMs, 0);

    const speciesList = await this.speciesRepo
      .createQueryBuilder("species")
      .select(["species.id", "species.scientificName"])
      .orderBy("species.id", "ASC")
      .limit(limit)
      .offset(offset)
      .getMany();

    const results: SpeciesExternalSyncResult[] = [];
    const errors: ExternalBatchSyncError[] = [];

    for (const species of speciesList) {
      try {
        const synced = await this.syncSpeciesReferencesEntity(
          species.id,
          species.scientificName,
        );
        results.push(synced);
      } catch (error) {
        errors.push({
          speciesId: species.id,
          scientificName: species.scientificName,
          reason: error instanceof Error ? error.message : "specie_not_found",
        });
      }

      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    return {
      limit,
      offset,
      processed: speciesList.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  private async syncSpeciesReferencesEntity(
    speciesId: number,
    scientificName: string,
  ): Promise<SpeciesExternalSyncResult> {
    const [gbifResult, iucnResult] = await Promise.all([
      this.syncGbifReference(speciesId, scientificName),
      this.syncIucnReference(speciesId, scientificName),
    ]);

    return {
      speciesId,
      scientificName,
      providers: [gbifResult, iucnResult],
    };
  }

  private async syncGbifReference(
    speciesId: number,
    scientificName: string,
  ): Promise<ProviderSyncResult> {
    const candidate = await this.resolveGbifMatch(scientificName);
    const result = await this.persistCandidate(
      speciesId,
      ExternalProvider.GBIF,
      candidate,
    );

    if (result.persisted && result.externalId) {
      await this.syncGbifCoverage(speciesId, result.externalId);
    }

    return result;
  }

  private async syncGbifCoverage(
    speciesId: number,
    usageKey: string,
  ): Promise<void> {
    const coverage = await this.fetchGbifCoverage(usageKey);

    if (!coverage) {
      return;
    }

    const ref = await this.refRepo.findOneBy({
      speciesId,
      provider: ExternalProvider.GBIF,
    });

    if (!ref) {
      return;
    }

    await this.mergeRefMeta(ref, "coverage", coverage);
  }

  private async fetchGbifCoverage(
    usageKey: string,
  ): Promise<GbifCoverageMeta | null> {
    try {
      const { results, count } = await this.fetchGbifOccurrencePage(
        usageKey,
        0,
        GBIF_PAGE_SIZE,
      );
      const bbox = this.computeBoundingBox(results);

      return {
        hasCoordinates: count > 0,
        occurrenceCount: count,
        validatedAt: new Date().toISOString(),
        bbox,
      };
    } catch {
      return null;
    }
  }

  private async fetchGbifOccurrencePage(
    usageKey: string,
    offset: number,
    limit: number,
  ): Promise<{ results: Array<Record<string, unknown>>; count: number }> {
    const { data } = await axios.get(
      `${ENV.GBIF_API_BASE}/v1/occurrence/search`,
      {
        params: {
          taxonKey: usageKey,
          hasCoordinate: true,
          hasGeospatialIssue: false,
          offset,
          limit,
        },
        timeout: HTTP_TIMEOUT_MS,
      },
    );

    return {
      results: Array.isArray(data?.results) ? data.results : [],
      count: typeof data?.count === "number" ? data.count : 0,
    };
  }

  // Pagina occurrence/search hasta maxRecords; ante cualquier fallo devuelve lo ya acumulado (nunca lanza).
  private async fetchGbifOccurrencesBulk(
    usageKey: string,
    maxRecords: number,
  ): Promise<Array<Record<string, unknown>>> {
    const collected: Array<Record<string, unknown>> = [];
    let offset = 0;

    while (collected.length < maxRecords) {
      const pageSize = Math.min(GBIF_PAGE_SIZE, maxRecords - collected.length);

      try {
        const page = await this.fetchGbifOccurrencePage(
          usageKey,
          offset,
          pageSize,
        );
        collected.push(...page.results);

        if (page.results.length < pageSize) {
          break;
        }
      } catch {
        break;
      }

      offset += pageSize;
    }

    return collected;
  }

  private computeBoundingBox(
    results: Array<Record<string, unknown>>,
  ): GbifBoundingBox | null {
    const points = this.extractValidCoordinates(results);

    if (points.length === 0) {
      return null;
    }

    // Con pocos puntos el percentil no aporta (y podría descartar el único registro real): usamos min/max.
    if (points.length < MIN_POINTS_FOR_PERCENTILE_BBOX) {
      return this.computeMinMaxBoundingBox(points);
    }

    return this.computePercentileBoundingBox(
      points,
      BBOX_LOWER_PERCENTILE,
      BBOX_UPPER_PERCENTILE,
    );
  }

  private extractValidCoordinates(
    results: Array<Record<string, unknown>>,
  ): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];

    for (const record of results) {
      const point = this.extractLatLng(record);
      if (point) {
        points.push(point);
      }
    }

    return points;
  }

  private extractLatLng(
    record: Record<string, unknown>,
  ): { lat: number; lng: number } | null {
    const lat = record["decimalLatitude"];
    const lng = record["decimalLongitude"];

    if (typeof lat !== "number" || typeof lng !== "number") {
      return null;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  }

  private computeMinMaxBoundingBox(
    points: Array<{ lat: number; lng: number }>,
  ): GbifBoundingBox {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const { lat, lng } of points) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  // Descarta outliers extremos: usa percentil inferior/superior en vez del min/max real.
  private computePercentileBoundingBox(
    points: Array<{ lat: number; lng: number }>,
    lowerPercentile: number,
    upperPercentile: number,
  ): GbifBoundingBox {
    const lats = points.map((p) => p.lat).sort((a, b) => a - b);
    const lngs = points.map((p) => p.lng).sort((a, b) => a - b);

    return {
      minLat: this.percentileOf(lats, lowerPercentile),
      maxLat: this.percentileOf(lats, upperPercentile),
      minLng: this.percentileOf(lngs, lowerPercentile),
      maxLng: this.percentileOf(lngs, upperPercentile),
    };
  }

  // Percentil con interpolación lineal (mismo método que numpy/Excel).
  private percentileOf(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 1) {
      return sortedValues[0];
    }

    const rank = (percentile / 100) * (sortedValues.length - 1);
    const lowerIndex = Math.floor(rank);
    const upperIndex = Math.ceil(rank);

    if (lowerIndex === upperIndex) {
      return sortedValues[lowerIndex];
    }

    const weight = rank - lowerIndex;
    return (
      sortedValues[lowerIndex] * (1 - weight) +
      sortedValues[upperIndex] * weight
    );
  }

  private readGbifCoverage(
    meta: Record<string, unknown> | null,
  ): GbifCoverageMeta | null {
    if (!meta) {
      return null;
    }

    const coverage = meta["coverage"];
    if (!coverage || typeof coverage !== "object") {
      return null;
    }

    const record = coverage as Record<string, unknown>;
    const hasCoordinates =
      typeof record["hasCoordinates"] === "boolean"
        ? (record["hasCoordinates"] as boolean)
        : null;
    const occurrenceCount =
      typeof record["occurrenceCount"] === "number"
        ? (record["occurrenceCount"] as number)
        : null;
    const validatedAt =
      typeof record["validatedAt"] === "string"
        ? (record["validatedAt"] as string)
        : null;

    if (
      hasCoordinates === null ||
      occurrenceCount === null ||
      validatedAt === null
    ) {
      return null;
    }

    const rawBbox = record["bbox"];
    const bbox =
      rawBbox && typeof rawBbox === "object"
        ? this.parseStoredBoundingBox(rawBbox as Record<string, unknown>)
        : null;

    // Cache antiguo de antes de que existiera el bbox (o de un cálculo fallido): se recalcula.
    if (hasCoordinates && occurrenceCount > 0 && !bbox) {
      return null;
    }

    return { hasCoordinates, occurrenceCount, validatedAt, bbox };
  }

  private parseStoredBoundingBox(
    record: Record<string, unknown>,
  ): GbifBoundingBox | null {
    const minLat = record["minLat"];
    const maxLat = record["maxLat"];
    const minLng = record["minLng"];
    const maxLng = record["maxLng"];

    if (
      typeof minLat !== "number" ||
      typeof maxLat !== "number" ||
      typeof minLng !== "number" ||
      typeof maxLng !== "number"
    ) {
      return null;
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  private getMetaRecord(
    meta: Record<string, unknown> | null,
    key: "range" | "points",
  ): Record<string, unknown> | null {
    if (!meta) {
      return null;
    }

    const value = meta[key];
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  }

  // Hull cóncavo (fallback a convexo) sobre las coordenadas; maxEdge escala con el tamaño del bbox real.
  // Con pocos puntos (o si el hull falla) se usa un buffer circular por punto: nunca null habiendo coordenadas.
  private computeRangeGeometry(
    points: Array<{ lat: number; lng: number }>,
  ): RangeGeometry | null {
    if (points.length === 0) {
      return null;
    }

    if (points.length < RANGE_MIN_POINTS) {
      return this.bufferSparsePoints(points);
    }

    const featureCollection = turf.featureCollection(
      points.map((p) => turf.point([p.lng, p.lat])),
    );

    const bbox = this.computeMinMaxBoundingBox(points);
    const diagonalKm = turf.distance(
      turf.point([bbox.minLng, bbox.minLat]),
      turf.point([bbox.maxLng, bbox.maxLat]),
      { units: "kilometers" },
    );
    const maxEdge = Math.max(
      RANGE_MIN_MAX_EDGE_KM,
      diagonalKm * RANGE_MAX_EDGE_RATIO,
    );

    let hull;
    try {
      hull =
        turf.concave(featureCollection, { maxEdge, units: "kilometers" }) ??
        turf.convex(featureCollection);
    } catch {
      hull = null;
    }

    if (!hull) {
      return this.bufferSparsePoints(points);
    }

    let simplified = hull;
    try {
      simplified = turf.simplify(hull, {
        tolerance: RANGE_SIMPLIFY_TOLERANCE_DEG,
        highQuality: false,
      });
    } catch {
      simplified = hull;
    }

    const geometry = simplified.geometry;
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      return geometry as RangeGeometry;
    }

    return this.bufferSparsePoints(points);
  }

  // Nunca devuelve null si hay al menos 1 punto válido: dibuja un pequeño círculo por coordenada.
  private bufferSparsePoints(
    points: Array<{ lat: number; lng: number }>,
  ): RangeGeometry | null {
    const circles: Array<Feature<Polygon | MultiPolygon>> = [];

    for (const p of points) {
      let circle: Feature<Polygon | MultiPolygon> | undefined;
      try {
        circle = turf.buffer(
          turf.point([p.lng, p.lat]),
          RANGE_SPARSE_BUFFER_KM,
          { units: "kilometers" },
        );
      } catch {
        circle = undefined;
      }

      if (circle) {
        circles.push(circle);
      }
    }

    if (circles.length === 0) {
      return null;
    }

    if (circles.length === 1) {
      const geometry = circles[0].geometry;
      return geometry.type === "Polygon" ? (geometry as RangeGeometry) : null;
    }

    const coordinates: number[][][][] = [];
    for (const circle of circles) {
      if (circle.geometry.type === "Polygon") {
        coordinates.push(circle.geometry.coordinates);
      } else if (circle.geometry.type === "MultiPolygon") {
        coordinates.push(...circle.geometry.coordinates);
      }
    }

    return coordinates.length > 0
      ? { type: "MultiPolygon", coordinates }
      : null;
  }

  private readCachedRange(
    meta: Record<string, unknown> | null,
  ): CachedRange | null {
    const record = this.getMetaRecord(meta, "range");
    if (!record) {
      return null;
    }

    const sourceCount = record["sourceCount"];
    const fetchedAt = record["fetchedAt"];

    if (typeof sourceCount !== "number" || typeof fetchedAt !== "string") {
      return null;
    }

    const geometry = this.parseStoredRangeGeometry(record["geometry"]);

    // Cache antiguo de una versión que devolvía null con coordenadas válidas: se recalcula en vez de confiar en él.
    if (geometry === null && sourceCount > 0) {
      return null;
    }

    return { geometry, sourceCount, fetchedAt };
  }

  private parseStoredRangeGeometry(value: unknown): RangeGeometry | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const record = value as Record<string, unknown>;
    const type = record["type"];
    const coordinates = record["coordinates"];

    if (
      (type === "Polygon" || type === "MultiPolygon") &&
      Array.isArray(coordinates)
    ) {
      return { type, coordinates } as RangeGeometry;
    }

    return null;
  }

  private readCachedOccurrencePoints(
    meta: Record<string, unknown> | null,
  ): CachedOccurrencePoints | null {
    const record = this.getMetaRecord(meta, "points");
    if (!record) {
      return null;
    }

    const rawPoints = record["points"];
    const count = record["count"];
    const fetchedAt = record["fetchedAt"];

    if (
      !Array.isArray(rawPoints) ||
      typeof count !== "number" ||
      typeof fetchedAt !== "string"
    ) {
      return null;
    }

    const points = rawPoints
      .map((entry) => this.parseStoredOccurrencePoint(entry))
      .filter((point): point is OccurrencePoint => point !== null);

    return { points, count, fetchedAt };
  }

  private parseStoredOccurrencePoint(value: unknown): OccurrencePoint | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const record = value as Record<string, unknown>;
    const lat = record["lat"];
    const lng = record["lng"];
    const key = record["key"];

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof key !== "string"
    ) {
      return null;
    }

    return {
      key,
      lat,
      lng,
      dataset: this.toNullableString(record["dataset"]),
      country: this.toNullableString(record["country"]),
      eventDate: this.toNullableString(record["eventDate"]),
      basisOfRecord: this.toNullableString(record["basisOfRecord"]),
      publisher: this.toNullableString(record["publisher"]),
    };
  }

  // GBIF no garantiza estos campos en cada registro; ausentes -> null ("si existen").
  private toOccurrencePoint(
    record: Record<string, unknown>,
  ): OccurrencePoint | null {
    const coords = this.extractLatLng(record);
    if (!coords) {
      return null;
    }

    const key = record["key"];

    return {
      key:
        typeof key === "number" || typeof key === "string"
          ? String(key)
          : `${coords.lat},${coords.lng}`,
      lat: coords.lat,
      lng: coords.lng,
      dataset:
        this.toNullableString(record["datasetTitle"]) ??
        this.toNullableString(record["datasetKey"]),
      country: this.toNullableString(record["country"]),
      eventDate: this.toNullableString(record["eventDate"]),
      basisOfRecord: this.toNullableString(record["basisOfRecord"]),
      publisher:
        this.toNullableString(record["publisher"]) ??
        this.toNullableString(record["publishingOrgKey"]),
    };
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private async syncIucnReference(
    speciesId: number,
    scientificName: string,
  ): Promise<ProviderSyncResult> {
    const candidate = await this.resolveIucnMatch(scientificName);
    return this.persistCandidate(speciesId, ExternalProvider.IUCN, candidate);
  }

  private async persistCandidate(
    speciesId: number,
    provider: ExternalProvider,
    candidate: MatchCandidate,
  ): Promise<ProviderSyncResult> {
    if (!candidate.externalId) {
      return {
        provider,
        status: MatchStatus.NOT_FOUND,
        externalId: null,
        matchedName: candidate.matchedName,
        confidence: candidate.confidence,
        persisted: false,
        reason: candidate.reason ?? "no_external_id",
        meta: candidate.meta,
      };
    }

    const existingByExternal = await this.refRepo.findOneBy({
      provider,
      externalId: candidate.externalId,
    });

    if (existingByExternal && existingByExternal.speciesId !== speciesId) {
      return {
        provider,
        status: MatchStatus.REVIEW_NEEDED,
        externalId: candidate.externalId,
        matchedName: candidate.matchedName,
        confidence: candidate.confidence,
        persisted: false,
        reason: "external_id_conflict",
        meta: {
          ...candidate.meta,
          conflictingSpeciesId: existingByExternal.speciesId,
        },
      };
    }

    const existingBySpecies = await this.refRepo.findOneBy({
      speciesId,
      provider,
    });

    const row =
      existingBySpecies ?? this.refRepo.create({ speciesId, provider });

    row.externalId = candidate.externalId;
    row.matchedName = candidate.matchedName;
    row.confidence = candidate.confidence;
    row.matchStatus = candidate.status;
    row.meta = candidate.meta;

    await this.refRepo.save(row);

    return {
      provider,
      status: candidate.status,
      externalId: candidate.externalId,
      matchedName: candidate.matchedName,
      confidence: candidate.confidence,
      persisted: true,
      reason: candidate.reason,
      meta: candidate.meta,
    };
  }

  private async resolveGbifMatch(
    scientificName: string,
  ): Promise<MatchCandidate> {
    try {
      const { data } = await axios.get<GbifMatchResponse>(
        `${ENV.GBIF_API_BASE}/v1/species/match`,
        {
          params: {
            name: scientificName,
            strict: false,
            verbose: true,
          },
          timeout: HTTP_TIMEOUT_MS,
        },
      );

      const key = data.usageKey ?? data.speciesKey;
      if (!key) {
        return {
          externalId: null,
          matchedName: data.canonicalName ?? data.scientificName ?? null,
          confidence: this.normalizeConfidence(data.confidence),
          status: MatchStatus.NOT_FOUND,
          reason: "gbif_no_usage_key",
          meta: {
            rank: data.rank ?? null,
            status: data.status ?? null,
            matchType: data.matchType ?? null,
          },
        };
      }

      const confidence = this.normalizeConfidence(data.confidence);
      const status = this.resolveGbifStatus(data, confidence);

      return {
        externalId: String(key),
        matchedName: data.canonicalName ?? data.scientificName ?? null,
        confidence,
        status,
        reason: null,
        meta: {
          usageKey: data.usageKey ?? null,
          speciesKey: data.speciesKey ?? null,
          rank: data.rank ?? null,
          status: data.status ?? null,
          matchType: data.matchType ?? null,
        },
      };
    } catch {
      return {
        externalId: null,
        matchedName: null,
        confidence: null,
        status: MatchStatus.NOT_FOUND,
        reason: "gbif_request_failed",
        meta: null,
      };
    }
  }

  private resolveGbifStatus(
    data: GbifMatchResponse,
    confidence: number | null,
  ): MatchStatus {
    const rank = (data.rank ?? "").toUpperCase();
    const accepted = (data.status ?? "").toUpperCase() === "ACCEPTED";
    const speciesLevelRanks = ["SPECIES", "SUBSPECIES", "VARIETY", "FORM"];
    const isSpeciesLevel = speciesLevelRanks.includes(rank);

    if (
      accepted &&
      isSpeciesLevel &&
      (confidence ?? 0) >= GBIF_AUTO_CONFIDENCE
    ) {
      return MatchStatus.AUTO;
    }

    return MatchStatus.REVIEW_NEEDED;
  }

  private async resolveIucnMatch(
    scientificName: string,
  ): Promise<MatchCandidate> {
    const parsedName = this.toGenusSpecies(scientificName);

    if (!parsedName || !parsedName.species) {
      return {
        externalId: null,
        matchedName: null,
        confidence: null,
        status: MatchStatus.NOT_FOUND,
        reason: "invalid_scientific_name",
        meta: null,
      };
    }

    if (!ENV.IUCN_TOKEN) {
      return {
        externalId: null,
        matchedName: null,
        confidence: null,
        status: MatchStatus.NOT_FOUND,
        reason: "iucn_token_missing",
        meta: null,
      };
    }

    const endpoint = `${ENV.IUCN_API_BASE}/taxa/scientific_name`;
    const baseParams = {
      genus_name: parsedName.genus,
      species_name: parsedName.species,
    };

    const payload =
      (await this.fetchIucnByBearer(endpoint, baseParams)) ??
      (await this.fetchIucnByTokenParam(endpoint, baseParams));

    if (!payload) {
      return {
        externalId: null,
        matchedName: null,
        confidence: null,
        status: MatchStatus.NOT_FOUND,
        reason: "iucn_request_failed",
        meta: null,
      };
    }

    const record = this.pickIucnRecord(payload);

    if (!record) {
      return {
        externalId: null,
        matchedName: null,
        confidence: null,
        status: MatchStatus.NOT_FOUND,
        reason: "iucn_not_found",
        meta: this.iucnMeta(payload, null, null),
      };
    }

    const { externalId, idField } = this.extractIucnExternalId(record);
    const matchedName =
      this.getString(record, [
        "scientific_name",
        "scientificName",
        "taxon_name",
        "name",
        "binomial",
      ]) ?? scientificName;

    const confidence = this.iucnConfidence(scientificName, matchedName);
    const status =
      externalId && confidence >= IUCN_AUTO_CONFIDENCE
        ? MatchStatus.AUTO
        : MatchStatus.REVIEW_NEEDED;

    return {
      externalId,
      matchedName,
      confidence,
      status,
      reason: externalId ? null : "iucn_external_id_missing",
      meta: this.iucnMeta(payload, idField, record),
    };
  }

  private async fetchIucnByBearer(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<unknown | null> {
    try {
      const response = await axios.get(endpoint, {
        params,
        headers: {
          Authorization: `Bearer ${ENV.IUCN_TOKEN}`,
          Accept: "application/json",
          "user-client": "endangered-species-app",
        },
        timeout: HTTP_TIMEOUT_MS,
      });

      return response.data;
    } catch {
      return null;
    }
  }

  private async fetchIucnByTokenParam(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<unknown | null> {
    try {
      const response = await axios.get(endpoint, {
        params: {
          ...params,
          token: ENV.IUCN_TOKEN,
        },
        timeout: HTTP_TIMEOUT_MS,
      });

      return response.data;
    } catch {
      return null;
    }
  }

  private iucnMeta(
    payload: unknown,
    idField: string | null,
    record: Record<string, unknown> | null,
  ): Record<string, unknown> {
    const root = this.toRecord(payload);

    return {
      idField,
      hasAssessments: Array.isArray(root?.["assessments"]),
      recordKeys: record ? Object.keys(record).slice(0, 20) : [],
    };
  }

  private pickIucnRecord(payload: unknown): Record<string, unknown> | null {
    if (Array.isArray(payload)) {
      return this.toRecord(payload[0]);
    }

    const root = this.toRecord(payload);
    if (!root) {
      return null;
    }

    const candidateArrays = [
      "assessments",
      "result",
      "results",
      "taxa",
      "data",
    ];

    for (const key of candidateArrays) {
      const value = root[key];
      if (Array.isArray(value) && value.length > 0) {
        const first = this.toRecord(value[0]);
        if (first) {
          return first;
        }
      }
    }

    const hasDirectId =
      this.getString(root, [
        "taxonid",
        "taxon_id",
        "sis_taxon_id",
        "assessment_id",
        "id",
        "internalTaxonId",
      ]) !== null;

    return hasDirectId ? root : null;
  }

  private extractIucnExternalId(record: Record<string, unknown>): {
    externalId: string | null;
    idField: string | null;
  } {
    const idFields = [
      "taxonid",
      "taxon_id",
      "sis_taxon_id",
      "assessment_id",
      "id",
      "internalTaxonId",
    ];

    for (const field of idFields) {
      const value = this.getString(record, [field]);
      if (value) {
        return { externalId: value, idField: field };
      }
    }

    return { externalId: null, idField: null };
  }

  private iucnConfidence(
    requestedScientificName: string,
    matchedName: string,
  ): number {
    const normalizedRequested = requestedScientificName.trim().toLowerCase();
    const normalizedMatched = matchedName.trim().toLowerCase();

    if (normalizedRequested === normalizedMatched) {
      return 100;
    }

    const requestedBinomial = this.toGenusSpecies(normalizedRequested);
    const matchedBinomial = this.toGenusSpecies(normalizedMatched);

    if (
      requestedBinomial &&
      matchedBinomial &&
      requestedBinomial.genus === matchedBinomial.genus &&
      requestedBinomial.species === matchedBinomial.species
    ) {
      return 95;
    }

    return 80;
  }

  private normalizeConfidence(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }

    const clamped = Math.max(0, Math.min(100, value));
    return Number(clamped.toFixed(2));
  }

  private toGenusSpecies(
    scientificName: string,
  ): { genus: string; species: string | null } | null {
    const clean = scientificName.trim();
    if (!clean) {
      return null;
    }

    const tokens = clean.split(/\s+/);
    if (tokens.length === 0) {
      return null;
    }

    const genus = tokens[0];
    const species = tokens.length >= 2 ? tokens[1] : null;

    return { genus, species };
  }

  private getString(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return fallback;
    }

    return parsed;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
