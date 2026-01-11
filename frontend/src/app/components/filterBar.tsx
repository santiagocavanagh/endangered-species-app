import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

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
  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "critico", label: "En peligro crítico" },
    { value: "peligro", label: "En peligro" },
    { value: "vulnerable", label: "Vulnerable" },
  ];

  const habitatOptions = {
    animal: [
      { value: "all", label: "Todos los hábitats" },
      { value: "bosque", label: "Bosque" },
      { value: "marino", label: "Marino" },
      { value: "desierto", label: "Desierto" },
      { value: "montaña", label: "Montaña" },
    ],
    planta: [
      { value: "all", label: "Todos los hábitats" },
      { value: "tropical", label: "Tropical" },
      { value: "templado", label: "Templado" },
      { value: "desertico", label: "Desértico" },
      { value: "acuatico", label: "Acuático" },
    ],
    hongo: [
      { value: "all", label: "Todos los hábitats" },
      { value: "bosque", label: "Bosque" },
      { value: "pradera", label: "Pradera" },
      { value: "humedo", label: "Húmedo" },
      { value: "montaña", label: "Montaña" },
    ],
  };

  const regionOptions = [
    { value: "all", label: "Todas las regiones" },
    { value: "america", label: "América" },
    { value: "europa", label: "Europa" },
    { value: "asia", label: "Asia" },
    { value: "africa", label: "África" },
    { value: "oceania", label: "Oceanía" },
  ];

  return (
    <div className="w-full bg-gray-50 border-b px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex-1 grid grid-cols-4 gap-3">
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
                {habitatOptions[category].map((option) => (
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
