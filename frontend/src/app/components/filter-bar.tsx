import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { Filter } from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FilterBarProps {
  category: "animal" | "planta" | "hongo";
  onFilterChange: (filters: Filters) => void;
  filters: Filters;
}

export interface Filters {
  search: string;
  status: string;
  habitat: string;
  region: string;
  orderName: string;
  family: string;
  genus: string;
}

interface TaxonomyOption {
  kingdom: string;
  orderName: string | null;
  family: string | null;
  genus: string | null;
}

const categoryToKingdom: Record<FilterBarProps["category"], string> = {
  animal: "animalia",
  planta: "plantae",
  hongo: "fungi",
};

export function FilterBar({
  category,
  filters,
  onFilterChange,
}: FilterBarProps) {
  const [taxonomyOptions, setTaxonomyOptions] = useState<TaxonomyOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "Todas las regiones" }]);

  useEffect(() => {
    api
      .getTaxonomies()
      .then((res: any) => {
        const data: TaxonomyOption[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        const kingdom = categoryToKingdom[category];
        setTaxonomyOptions(
          data.filter(
            (taxonomy) => String(taxonomy.kingdom).toLowerCase() === kingdom,
          ),
        );
      })
      .catch((error) => {
        console.error("Error cargando taxonomías:", error);
        setTaxonomyOptions([]);
      });
  }, [category]);

  useEffect(() => {
    if (filters.orderName === "all") {
      if (filters.family !== "all" || filters.genus !== "all") {
        onFilterChange({ ...filters, family: "all", genus: "all" });
      }
      return;
    }

    const orderExists = taxonomyOptions.some(
      (taxonomy) => taxonomy.orderName === filters.orderName,
    );

    if (!orderExists) {
      onFilterChange({
        ...filters,
        orderName: "all",
        family: "all",
        genus: "all",
      });
    }
  }, [taxonomyOptions, filters, onFilterChange]);

  useEffect(() => {
    api
      .getRegions()
      .then((res: any) => {
        interface Region {
          name: string;
        }

        const data: Region[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        const uniqueRegions = Array.from(
          new Map(
            data.map((region) => [
              region.name.toLowerCase(),
              { value: region.name, label: region.name },
            ]),
          ).values(),
        ).sort((a, b) => a.label.localeCompare(b.label));

        setRegionOptions([
          { value: "all", label: "Todas las regiones" },
          ...uniqueRegions,
        ]);
      })
      .catch((error) => {
        console.error("Error cargando regiones:", error);
      });
  }, []);

  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "EX", label: "Extinto" },
    { value: "CR", label: "En Peligro Crítico" },
    { value: "EN", label: "En Peligro" },
    { value: "VU", label: "Vulnerable" },
    { value: "NT", label: "Casi Amenazado" },
    { value: "LC", label: "Preocupación Menor" },
  ];

  const habitatOptions = [
    { value: "all", label: "Todos los hábitats" },
    { value: "bosque", label: "Bosque" },
    { value: "marino", label: "Marino" },
    { value: "desierto", label: "Desierto" },
    { value: "montaña", label: "Montaña" },
    { value: "tropical", label: "Tropical" },
    { value: "templado", label: "Templado" },
    { value: "desertico", label: "Desértico" },
    { value: "acuatico", label: "Acuático" },
    { value: "pradera", label: "Pradera" },
    { value: "humedo", label: "Húmedo" },
    { value: "artificial", label: "Artificial" },
    { value: "unknown", label: "Otros / Desconocido" },
  ];

  const orderOptions = useMemo(() => {
    const values = Array.from(
      new Map(
        taxonomyOptions
          .filter((taxonomy) => taxonomy.orderName)
          .map((taxonomy) => [
            taxonomy.orderName!.toLowerCase(),
            { value: taxonomy.orderName!, label: taxonomy.orderName! },
          ]),
      ).values(),
    ).sort((a, b) => a.label.localeCompare(b.label));

    return [{ value: "all", label: "Todos los órdenes" }, ...values];
  }, [taxonomyOptions]);

  const familyOptions = useMemo(() => {
    const values = Array.from(
      new Map(
        taxonomyOptions
          .filter(
            (taxonomy) =>
              taxonomy.orderName &&
              (filters.orderName === "all" ||
                taxonomy.orderName === filters.orderName) &&
              taxonomy.family,
          )
          .map((taxonomy) => [
            taxonomy.family!.toLowerCase(),
            { value: taxonomy.family!, label: taxonomy.family! },
          ]),
      ).values(),
    ).sort((a, b) => a.label.localeCompare(b.label));

    return [{ value: "all", label: "Todas las familias" }, ...values];
  }, [taxonomyOptions, filters.orderName]);

  const genusOptions = useMemo(() => {
    const values = Array.from(
      new Map(
        taxonomyOptions
          .filter(
            (taxonomy) =>
              taxonomy.orderName &&
              taxonomy.family &&
              (filters.orderName === "all" ||
                taxonomy.orderName === filters.orderName) &&
              (filters.family === "all" ||
                taxonomy.family === filters.family) &&
              taxonomy.genus,
          )
          .map((taxonomy) => [
            taxonomy.genus!.toLowerCase(),
            { value: taxonomy.genus!, label: taxonomy.genus! },
          ]),
      ).values(),
    ).sort((a, b) => a.label.localeCompare(b.label));

    return [{ value: "all", label: "Todos los géneros" }, ...values];
  }, [taxonomyOptions, filters.orderName, filters.family]);

  const handleOrderChange = (value: string) => {
    onFilterChange({
      ...filters,
      orderName: value,
      family: "all",
      genus: "all",
    });
  };

  const handleFamilyChange = (value: string) => {
    onFilterChange({
      ...filters,
      family: value,
      genus: "all",
    });
  };

  const handleGenusChange = (value: string) => {
    onFilterChange({ ...filters, genus: value });
  };

  return (
    <div className="w-full bg-gray-50 border-b px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-7 gap-3">
            <Input
              placeholder="Buscar especies..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              className="bg-white md:col-span-2"
            />
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFilterChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Estado de conservación" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.orderName} onValueChange={handleOrderChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Nivel 1: orden" />
              </SelectTrigger>
              <SelectContent>
                {orderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.family}
              onValueChange={handleFamilyChange}
              disabled={filters.orderName === "all"}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Nivel 2: familia" />
              </SelectTrigger>
              <SelectContent>
                {familyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.genus}
              onValueChange={handleGenusChange}
              disabled={filters.family === "all"}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Nivel 3: género" />
              </SelectTrigger>
              <SelectContent>
                {genusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.habitat}
              onValueChange={(value) =>
                onFilterChange({ ...filters, habitat: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Hábitat" />
              </SelectTrigger>
              <SelectContent>
                {habitatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.region}
              onValueChange={(value) =>
                onFilterChange({ ...filters, region: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
