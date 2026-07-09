import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Star,
  MapPin,
  AlertTriangle,
  Globe,
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
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { api } from "../../services/api";
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
  const [gbifKey, setGbifKey] = useState<number | null>(null);
  const [similar, setSimilar] = useState<Species[]>([]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSpecies(null);
    setGbifKey(null);
    setSimilar([]);
    setImgError(false);

    api.fetchSpeciesById(speciesId).then(async (data) => {
      if (!data) {
        setLoading(false);
        return;
      }
      setSpecies(data);
      setLoading(false);

      // GBIF occurrence key lookup (free, no auth required)
      if (data.scientificName) {
        fetch(
          `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(data.scientificName)}&verbose=false`,
        )
          .then((r) => r.json())
          .then((g) => {
            if (g.usageKey) setGbifKey(g.usageKey);
          })
          .catch(() => {});
      }

      // Similar species by genus → fallback to family
      const kingdom = data.taxonomy?.kingdom;
      if (kingdom) {
        const sim = await api.fetchSimilarSpecies({
          kingdom,
          genus: data.taxonomy?.genus ?? null,
          family: data.taxonomy?.family ?? null,
          excludeId: speciesId,
          limit: 6,
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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* ── Hero image ────────────────────────────────────────────── */}
      <div className="relative w-full h-[58vh] min-h-[340px] bg-gray-900 shrink-0">
        <img
          src={heroImage}
          alt={species.commonName ?? species.scientificName}
          className="w-full h-full object-cover opacity-90"
          onError={() => setImgError(true)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 px-4 py-2 rounded-full border border-white/20 transition-all font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        {/* Admin buttons */}
        {isAdmin && (
          <div className="absolute top-4 left-32 z-10 flex gap-2">
            <button
              onClick={() => onEdit?.(speciesAsCard)}
              className="flex items-center gap-1.5 bg-blue-600/80 backdrop-blur-sm text-white hover:bg-blue-600 px-3 py-2 rounded-full border border-blue-400/30 transition-all text-sm font-medium"
            >
              <Pencil size={14} />
              Editar
            </button>
            <button
              onClick={() => onDelete?.(species.id)}
              className="flex items-center gap-1.5 bg-red-600/80 backdrop-blur-sm text-white hover:bg-red-600 px-3 py-2 rounded-full border border-red-400/30 transition-all text-sm font-medium"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={() => onToggleFavorite(species.id)}
          className="absolute top-4 right-4 z-10 p-3 bg-black/30 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/50 transition-all"
          aria-label="Marcar como favorito"
        >
          <Star
            size={22}
            className={
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white"
            }
          />
        </button>

        {/* Species name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8">
          <Badge
            className={`${config.badgeCls} border mb-3 text-sm font-semibold px-3 py-1`}
          >
            <AlertTriangle className="h-3 w-3 mr-1.5" />
            {config.label}
            {trend === "declining" && (
              <TrendingDown className="h-3.5 w-3.5 ml-1.5 text-red-500" />
            )}
            {trend === "improving" && (
              <TrendingUp className="h-3.5 w-3.5 ml-1.5 text-green-500" />
            )}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
            {species.commonName || species.scientificName}
          </h1>
          {species.commonName && (
            <p className="text-base md:text-xl text-white/75 italic mt-1.5 drop-shadow">
              {species.scientificName}
            </p>
          )}
        </div>
      </div>

      {/* ── Quick stats bar ───────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <div className="flex flex-col items-center py-4 px-4">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                Estado UICN
              </span>
              <span className={`text-xl font-bold mt-1 ${config.textColor}`}>
                {species.iucnStatus}
              </span>
              <span className="text-xs text-gray-500 text-center mt-0.5">
                {config.label}
              </span>
            </div>
            <div className="flex flex-col items-center py-4 px-4">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                Población est.
              </span>
              <span className="text-xl font-bold mt-1 text-gray-800 text-center">
                {populationDisplay}
              </span>
              {species.latestCensus?.date && (
                <span className="text-xs text-gray-500 mt-0.5">
                  {species.latestCensus.date}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center py-4 px-4">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                Hábitat
              </span>
              <span className="text-base font-bold mt-1 text-gray-800 text-center line-clamp-2">
                {firstHabitatSegment}
              </span>
            </div>
            <div className="flex flex-col items-center py-4 px-4">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                Regiones
              </span>
              <span className="text-xl font-bold mt-1 text-gray-800">
                {species.regions?.length ?? 0}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                {(species.regions?.length ?? 0) === 1 ? "región" : "regiones"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Map */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <Globe size={20} className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Distribución Geográfica
            </h2>
          </div>
          <div
            className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-md"
            style={{ isolation: "isolate" }}
          >
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {gbifKey && (
                <TileLayer
                  url={`https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?taxonKey=${gbifKey}&style=classic.poly`}
                  attribution='&copy; <a href="https://www.gbif.org" target="_blank">GBIF</a>'
                  opacity={0.75}
                />
              )}
            </MapContainer>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            {gbifKey
              ? "Distribución basada en registros de ocurrencia de GBIF · Mapa base © OpenStreetMap"
              : "No se encontraron registros de ocurrencia en GBIF para esta especie · Mapa base © OpenStreetMap"}
          </p>
        </section>

        {/* Info grid */}
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
                    {species.iucnStatus} — {config.label}
                  </Badge>
                </div>
                {trend && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">
                      Tendencia del estado
                    </span>
                    <div className="flex items-center gap-1.5">
                      {trend === "declining" && (
                        <>
                          <TrendingDown size={15} className="text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            Deterioro
                          </span>
                        </>
                      )}
                      {trend === "improving" && (
                        <>
                          <TrendingUp size={15} className="text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            Mejora
                          </span>
                        </>
                      )}
                      {trend === "stable" && (
                        <>
                          <Minus size={15} className="text-blue-500" />
                          <span className="text-sm font-medium text-blue-600">
                            Estable
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
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

        {/* Similar species */}
        {similar.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Especies Similares
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
