import axios from "axios";
import { AppDataSource } from "../config/data.source";
import { ENV } from "../config/env.config";
import { Species } from "../entities/species.entity";
import {
  ExternalProvider,
  MatchStatus,
  SpeciesExternalRef,
} from "../entities/species-ref.entity";
import { NotFoundError } from "../errors/http.error";

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

interface GbifCoverageMeta {
  hasCoordinates: boolean;
  occurrenceCount: number;
  validatedAt: string;
}

export interface SpeciesDistributionDTO {
  speciesId: number;
  scientificName: string;
  provider: ExternalProvider | null;
  matchStatus: MatchStatus | null;
  externalId: string | null;
  hasData: boolean;
  occurrenceCount: number | null;
  tileUrlTemplate: string | null;
  attribution: string | null;
  lastValidatedAt: string | null;
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

  async syncSpeciesReferences(
    speciesId: number,
  ): Promise<SpeciesExternalSyncResult> {
    const species = await this.speciesRepo.findOneBy({ id: speciesId });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    return this.syncSpeciesReferencesFromEntity(
      species.id,
      species.scientificName,
    );
  }

  async getSpeciesDistribution(
    speciesId: number,
  ): Promise<SpeciesDistributionDTO> {
    const species = await this.speciesRepo.findOne({
      where: { id: speciesId },
      relations: ["externalRefs"],
    });

    if (!species) {
      throw new NotFoundError("Especie no encontrada");
    }

    let gbifRef = species.externalRefs?.find(
      (ref) => ref.provider === ExternalProvider.GBIF,
    );

    // Lazy match: si nunca se sincronizo esta especie con GBIF, se intenta
    // resolver aqui mismo en el primer request de distribucion.
    if (!gbifRef) {
      await this.syncGbifReference(species.id, species.scientificName);
      gbifRef =
        (await this.refRepo.findOneBy({
          speciesId: species.id,
          provider: ExternalProvider.GBIF,
        })) ?? undefined;
    }

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
        tileUrlTemplate: null,
        attribution: null,
        lastValidatedAt: null,
        reason: "no_gbif_reference",
      };
    }

    let coverage = this.readGbifCoverage(gbifRef.meta);

    if (!coverage) {
      coverage = await this.fetchGbifCoverage(gbifRef.externalId);

      if (coverage) {
        gbifRef.meta = { ...(gbifRef.meta ?? {}), coverage };
        await this.refRepo.save(gbifRef);
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
      tileUrlTemplate: hasData
        ? `${ENV.GBIF_API_BASE}/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?taxonKey=${gbifRef.externalId}`
        : null,
      attribution: hasData ? "Datos de distribución: GBIF.org" : null,
      lastValidatedAt: coverage?.validatedAt ?? null,
      reason: hasData ? null : "no_georeferenced_occurrences",
    };
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
        const synced = await this.syncSpeciesReferencesFromEntity(
          species.id,
          species.scientificName,
        );
        results.push(synced);
      } catch (error) {
        errors.push({
          speciesId: species.id,
          scientificName: species.scientificName,
          reason: error instanceof Error ? error.message : "unknown_error",
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

  private async syncSpeciesReferencesFromEntity(
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

    ref.meta = { ...(ref.meta ?? {}), coverage };
    await this.refRepo.save(ref);
  }

  private async fetchGbifCoverage(
    usageKey: string,
  ): Promise<GbifCoverageMeta | null> {
    try {
      const { data } = await axios.get(
        `${ENV.GBIF_API_BASE}/v1/occurrence/search`,
        {
          params: {
            taxonKey: usageKey,
            hasCoordinate: true,
            limit: 0,
          },
          timeout: HTTP_TIMEOUT_MS,
        },
      );

      const count = typeof data?.count === "number" ? data.count : 0;

      return {
        hasCoordinates: count > 0,
        occurrenceCount: count,
        validatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
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

    return { hasCoordinates, occurrenceCount, validatedAt };
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
