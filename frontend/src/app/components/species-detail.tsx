import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Star,
  MapPin,
  AlertTriangle,
  Microscope,
  Users,
  TreePine,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  Trash2,
  Images,
  FileText,
  Info,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { api, type SpeciesDistribution } from "../../services/api";
import { SpeciesCard, type Species } from "./species-card";
import { useAuth } from "../../context/auth-context";

interface SpeciesDetailPageProps {
  speciesId: number;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onViewSpecies: (id: number) => void;
  onEdit?: (species: Species) => void;
  onDelete?: (id: number) => void;
  favorites: Set<number>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; textColor: string; badgeCls: string }
> = {
  CR: {
    label: "En Peligro Crítico",
    textColor: "text-red-700",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
  },
  EN: {
    label: "En Peligro",
    textColor: "text-orange-700",
    badgeCls: "bg-orange-100 text-orange-800 border-orange-200",
  },
  VU: {
    label: "Vulnerable",
    textColor: "text-yellow-700",
    badgeCls: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  NT: {
    label: "Casi Amenazado",
    textColor: "text-blue-700",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  LC: {
    label: "Preocupación Menor",
    textColor: "text-green-700",
    badgeCls: "bg-green-100 text-green-800 border-green-200",
  },
  EX: {
    label: "Extinto",
    textColor: "text-gray-700",
    badgeCls: "bg-gray-100 text-gray-800 border-gray-200",
  },
  EW: {
    label: "Extinto en Silvestres",
    textColor: "text-purple-700",
    badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
  },
  DD: {
    label: "Datos Insuficientes",
    textColor: "text-gray-600",
    badgeCls: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const STATUS_SEVERITY: Record<string, number> = {
  LC: 0,
  NT: 1,
  VU: 2,
  EN: 3,
  CR: 4,
  EW: 5,
  EX: 6,
  DD: -1,
};

const FALLBACK_IMAGES: Record<string, string> = {
  animalia: "/animalae.png",
  plantae: "/plantae.png",
  fungi: "/fungi.png",
};

const TAXONOMY_LABELS: [string, string][] = [
  ["kingdom", "Reino"],
  ["phylum", "Filo"],
  ["className", "Clase"],
  ["orderName", "Orden"],
  ["family", "Familia"],
  ["genus", "Género"],
];

const KINGDOM_TO_CATEGORY: Record<string, "animal" | "planta" | "hongo"> = {
  animalia: "animal",
  plantae: "planta",
  fungi: "hongo",
};

const STATUS_LABELS: Record<string, string> = {
  CR: "En peligro critico",
  EN: "En peligro",
  VU: "Vulnerable",
  NT: "Casi amenazado",
  LC: "Preocupacion menor",
  DD: "Datos insuficientes",
  EW: "Extinta en estado silvestre",
  EX: "Extinta",
};

function toTitle(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function getTrend(
  statusHistory: { oldStatus: string; newStatus: string; changedAt: string }[],
  currentStatus: string,
) {
  if (!statusHistory?.length) return null;
  const sorted = [...statusHistory].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );
  const latest = sorted[0];
  const prevSev = STATUS_SEVERITY[latest.oldStatus];
  const currSev = STATUS_SEVERITY[currentStatus];
  if (
    prevSev === undefined ||
    currSev === undefined ||
    prevSev < 0 ||
    currSev < 0
  )
    return null;
  if (currSev > prevSev) return "declining";
  if (currSev < prevSev) return "improving";
  return "stable";
}

export function SpeciesDetailPage({
  speciesId,
  onBack,
  isFavorite,
  onToggleFavorite,
  onViewSpecies,
  onEdit,
  onDelete,
  favorites,
}: SpeciesDetailPageProps) {
  const { isAdmin } = useAuth();
  const [species, setSpecies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<SpeciesDistribution | null>(
    null,
  );
  const [distributionLoading, setDistributionLoading] = useState(true);
  const [similar, setSimilar] = useState<Species[]>([]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSpecies(null);
    setDistribution(null);
    setDistributionLoading(true);
    setSimilar([]);
    setImgError(false);

    api.fetchSpeciesById(speciesId).then(async (data) => {
      if (!data) {
        setLoading(false);
        return;
      }
      setSpecies(data);
      setLoading(false);

      api.fetchSpeciesDistribution(speciesId).then((dist) => {
        setDistribution(dist);
        setDistributionLoading(false);
      });

      // Similar species by genus → fallback to family
      const kingdom = data.taxonomy?.kingdom;
      if (kingdom) {
        const sim = await api.fetchSimilarSpecies({
          kingdom,
          genus: data.taxonomy?.genus ?? null,
          family: data.taxonomy?.family ?? null,
          excludeId: speciesId,
          limit: 5,
        });
        setSimilar(sim);
      }
    });
  }, [speciesId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!species) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">No se encontró la especie.</p>
          <button
            onClick={onBack}
            className="text-emerald-600 underline font-medium"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  const kingdom = String(species.taxonomy?.kingdom ?? "").toLowerCase();
  const fallbackImg = FALLBACK_IMAGES[kingdom] ?? "/animalae.png";
  const heroImage =
    !imgError && species.media?.[0]?.mediaUrl
      ? species.media[0].mediaUrl
      : fallbackImg;

  const config = STATUS_CONFIG[species.iucnStatus] ?? {
    label: species.iucnStatus,
    textColor: "text-gray-700",
    badgeCls: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const trend = getTrend(species.statusHistory ?? [], species.iucnStatus);

  const speciesAsCard: Species = {
    id: species.id,
    name: species.commonName ?? species.scientificName,
    scientificName: species.scientificName,
    status: species.iucnStatus,
    habitat: species.habitat ?? "",
    region: Array.isArray(species.regions) ? species.regions.join(", ") : "",
    population:
      species.latestCensus?.populationDisplay ??
      (species.latestCensus?.population != null
        ? String(species.latestCensus.population)
        : ""),
    imageUrl: heroImage,
    taxonomyId: species.taxonomyId,
    category: KINGDOM_TO_CATEGORY[kingdom] ?? "animal",
  };

  const populationDisplay =
    species.latestCensus?.populationDisplay ??
    (species.latestCensus?.population != null
      ? Number(species.latestCensus.population).toLocaleString("es-ES")
      : "Sin datos");

  const firstHabitatSegment = species.habitat
    ? species.habitat.split(/[;,]/)[0].trim()
    : "Sin datos";

  const trendLabel =
    trend === "declining"
      ? "Descenso"
      : trend === "improving"
        ? "Aumento"
        : trend === "stable"
          ? "Estable"
          : "Sin registro";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(species.id)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                <Star
                  size={16}
                  className={
                    isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600"
                  }
                />
                Favorito
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => onEdit?.(speciesAsCard)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete?.(species.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <Badge className={`${config.badgeCls} border mb-2`}>
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {config.label}
            </Badge>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
              {species.commonName || species.scientificName}
            </h1>
            <p className="text-gray-500 italic mt-1">
              {species.scientificName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 items-start">
            <article className="w-full">
              <div className="w-full aspect-square rounded-xl overflow-hidden border bg-gray-100">
                <img
                  src={heroImage}
                  alt={species.commonName ?? species.scientificName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              </div>
            </article>

            <article className="w-full">
              <div className="w-full aspect-square rounded-xl overflow-hidden border bg-white relative">
                {distributionLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : distribution?.hasData && distribution.tileUrlTemplate ? (
                  <MapContainer
                    center={[10, 0]}
                    zoom={1}
                    scrollWheelZoom={false}
                    attributionControl={false}
                    className="w-full h-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <TileLayer url={distribution.tileUrlTemplate} />
                  </MapContainer>
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
          </div>
        </section>

        {/* Ficha de datos */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Taxonomy */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Microscope size={17} className="text-emerald-600" />
                Clasificación Taxonómica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-50">
                {species.taxonomy &&
                  TAXONOMY_LABELS.map(([key, label]) => {
                    const val = (species.taxonomy as Record<string, any>)[key];
                    if (!val) return null;
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {val}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Population & Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Users size={17} className="text-emerald-600" />
                Población y Conservación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-50">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Estado UICN</span>
                  <Badge className={`${config.badgeCls} border text-xs`}>
                    {species.iucnStatus} - {config.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">
                    Tendencia poblacional
                  </span>
                  <div className="flex items-center gap-1.5">
                    {trend === "declining" && (
                      <TrendingDown size={15} className="text-red-500" />
                    )}
                    {trend === "improving" && (
                      <TrendingUp size={15} className="text-green-500" />
                    )}
                    {trend === "stable" && (
                      <Minus size={15} className="text-blue-500" />
                    )}
                    {!trend && <Info size={15} className="text-gray-400" />}
                    <span className="text-sm font-medium text-gray-900">
                      {trendLabel}
                    </span>
                  </div>
                </div>
                {species.latestCensus && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">
                        Población estimada
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {populationDisplay}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">
                        Fecha del censo
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {species.latestCensus.date}
                      </span>
                    </div>
                    {species.latestCensus.source?.name && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-500">Fuente</span>
                        <span className="text-sm font-medium text-gray-900">
                          {species.latestCensus.source.name}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {!species.latestCensus && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Poblacion</span>
                    <span className="text-sm font-medium text-gray-900">
                      Sin registro
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Geographic regions */}
          {species.regions?.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <MapPin size={17} className="text-emerald-600" />
                  Distribución por Regiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(species.regions as string[]).map((region) => (
                    <Badge
                      key={region}
                      variant="outline"
                      className="bg-emerald-50 border-emerald-200 text-emerald-700 capitalize text-xs"
                    >
                      {region}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Habitat */}
          {species.habitat && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <TreePine size={17} className="text-emerald-600" />
                  Hábitat y Ecología
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {species.habitat}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {species.description && (
            <Card className="shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <FileText size={17} className="text-emerald-600" />
                  Descripción y Características
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {species.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Info size={17} className="text-emerald-600" />
                Ficha Resumen de la Especie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Nombre cientifico</p>
                  <p className="font-medium text-gray-900 italic">
                    {species.scientificName}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Nombre comun</p>
                  <p className="font-medium text-gray-900">
                    {species.commonName ?? "Sin dato"}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Poblacion</p>
                  <p className="font-medium text-gray-900">
                    {populationDisplay}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Tendencia</p>
                  <p className="font-medium text-gray-900">{trendLabel}</p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Orden</p>
                  <p className="font-medium text-gray-900">
                    {species.taxonomy?.orderName ?? "Sin dato"}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-gray-500">Familia</p>
                  <p className="font-medium text-gray-900">
                    {species.taxonomy?.family ?? "Sin dato"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status history */}
          {species.statusHistory?.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Calendar size={17} className="text-emerald-600" />
                  Historial de Estado de Conservación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-50">
                  {[
                    ...(species.statusHistory as {
                      oldStatus: string;
                      newStatus: string;
                      changedAt: string;
                    }[]),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.changedAt).getTime() -
                        new Date(a.changedAt).getTime(),
                    )
                    .map((h, i) => {
                      const prevCfg = STATUS_CONFIG[h.oldStatus];
                      const newCfg = STATUS_CONFIG[h.newStatus];
                      const worsened =
                        (STATUS_SEVERITY[h.newStatus] ?? 0) >
                        (STATUS_SEVERITY[h.oldStatus] ?? 0);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-gray-500 shrink-0 mr-2">
                            {h.changedAt}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`${prevCfg?.badgeCls ?? "bg-gray-100 border-gray-200"} border text-xs`}
                            >
                              {h.oldStatus}
                            </Badge>
                            {worsened ? (
                              <TrendingDown
                                size={13}
                                className="text-red-500 shrink-0"
                              />
                            ) : (
                              <TrendingUp
                                size={13}
                                className="text-green-500 shrink-0"
                              />
                            )}
                            <Badge
                              className={`${newCfg?.badgeCls ?? "bg-gray-100 border-gray-200"} border text-xs`}
                            >
                              {h.newStatus}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media gallery (if more than 1 image) */}
          {species.media?.length > 1 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Images size={17} className="text-emerald-600" />
                  Galería de Imágenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(species.media as { mediaUrl: string; credit?: string }[])
                    .slice(1, 7)
                    .map((m, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={m.mediaUrl}
                          alt={`Imagen ${i + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <FileText size={17} className="text-emerald-600" />
                Datos Relevantes y Diferencias Unicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>
                <span className="font-semibold">Dato curioso:</span>{" "}
                {species.commonName ?? species.scientificName} pertenece al
                grupo taxonomico{" "}
                <span className="font-medium">
                  {toTitle(
                    species.taxonomy?.genus ??
                      species.taxonomy?.family ??
                      "sin clasificacion detallada",
                  )}
                </span>{" "}
                y actualmente se clasifica como{" "}
                <span className="font-medium">
                  {STATUS_LABELS[species.iucnStatus] ?? species.iucnStatus}
                </span>
                .
              </p>
              <p>
                <span className="font-semibold">
                  Diferencia frente a especies similares:
                </span>{" "}
                en esta ficha se destaca por su habitat{" "}
                <span className="font-medium">
                  {firstHabitatSegment || "no especificado"}
                </span>{" "}
                y por su distribucion actual en{" "}
                <span className="font-medium">
                  {Array.isArray(species.regions) && species.regions.length > 0
                    ? species.regions.join(", ")
                    : "regiones sin registro"}
                </span>
                .
              </p>
              <p className="text-xs text-gray-500">
                Esta seccion esta preparada para enriquecerla con texto
                editorial especifico de cada especie (comportamiento, rasgos
                unicos, adaptaciones, subespecies) cuando agreguemos esa data en
                backend.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Similar species */}
        {similar.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              especies sugeridas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((s) => (
                <SpeciesCard
                  key={s.id}
                  species={s}
                  isFavorite={favorites.has(s.id)}
                  onToggleFavorite={onToggleFavorite}
                  onView={onViewSpecies}
                />
              ))}
            </div>
          </section>
        )}

        <div className="pb-4" />
      </div>
    </div>
  );
}
