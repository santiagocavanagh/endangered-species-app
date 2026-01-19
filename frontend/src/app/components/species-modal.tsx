import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { X, Save, Trash2, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { Species } from "./species-card";

interface SpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  speciesToEdit: Species | null;
  activeCategory: "animal" | "planta" | "hongo";
}

type SpeciesForm = Omit<Species, 'id'>;

export function SpeciesModal({ isOpen, onClose, onSuccess, speciesToEdit, activeCategory }: SpeciesModalProps) {
  const initialForm: SpeciesForm = {
    name: "",
    scientificName: "",
    status: "vulnerable",
    habitat: "",
    region: "",
    population: "",
    imageUrl: "",
    category: activeCategory
  };

  const [formData, setFormData] = useState<SpeciesForm>(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (speciesToEdit) {
      setFormData({
        name: speciesToEdit.name,
        scientificName: speciesToEdit.scientificName,
        status: speciesToEdit.status,
        habitat: speciesToEdit.habitat,
        region: speciesToEdit.region,
        population: speciesToEdit.population,
        imageUrl: speciesToEdit.imageUrl,
        category: speciesToEdit.category,
      });
    } else {
      setFormData({ ...initialForm, category: activeCategory });
    }
  }, [speciesToEdit, isOpen, activeCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = speciesToEdit 
      ? await api.updateSpecies(speciesToEdit.id, formData)
      : await api.createSpecies(formData);

    setLoading(false);

    if (res.error) {
      alert("Error: " + res.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!speciesToEdit) return;
    if (!window.confirm(`¿Estás seguro de eliminar "${speciesToEdit.name}"?`)) return;

    setLoading(true);
    const res = await api.deleteSpecies(speciesToEdit.id);
    setLoading(false);

    if (res.error) {
      alert("Error al eliminar: " + res.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {speciesToEdit ? 'Editar Registro' : 'Nueva Especie'}
            </h2>
            <p className="text-sm text-gray-500 capitalize">{formData.category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Común</Label>
              <input
                id="name"
                required
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientificName">Nombre Científico</Label>
              <input
                id="scientificName"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none italic"
                value={formData.scientificName}
                onChange={e => setFormData({...formData, scientificName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado de Conservación</Label>
              <select
                id="status"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="vulnerable">Vulnerable</option>
                <option value="peligro">En Peligro</option>
                <option value="critico">En Peligro Crítico</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Región / Ubicación</Label>
              <input
                id="region"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.region}
                onChange={e => setFormData({...formData, region: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habitat">Hábitat</Label>
              <input
                id="habitat"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.habitat}
                onChange={e => setFormData({...formData, habitat: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="population">Población Estimada</Label>
              <input
                id="population"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.population}
                onChange={e => setFormData({...formData, population: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de la Imagen</Label>
            <input
              id="imageUrl"
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <div className="pt-4 border-t flex flex-col sm:flex-row justify-between gap-3">
            {speciesToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={18} /> Eliminar Registro
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-3 ml-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-8 py-2 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 shadow-lg active:scale-95 transition-all disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {speciesToEdit ? 'Actualizar Especie' : 'Crear Especie'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}