import { useEffect, useState } from "react";
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
}

export function FilterBar({
  category,
  onFilterChange,
  filters,
}: FilterBarProps) {
  const [regionOptions, setRegionOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "Todas las regiones" }]);

  useEffect(() => {
    api
      .getRegions()
      .then((res: any) => {
        interface Region {
          type: string;
          name: string;
        }
        const data: Region[] = Array.isArray(res)
          ? res
          : res.data && Array.isArray(res.data)
            ? res.data
            : [];
        const uniqueRegions = Array.from(
          new Map(
            data.map((r: Region) => [
              r.name.toLowerCase(),
              { value: r.name, label: r.name },
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

  return (
    <div className="w-full bg-gray-50 border-b px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar especies..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              className="bg-white"
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
