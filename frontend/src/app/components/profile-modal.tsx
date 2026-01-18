import { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { api } from "../../services/api";

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, login } = useAuth(); 
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setPassword('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada real a la API
      const response = await api.updateProfile({ 
        name: name || undefined, 
        password: password || undefined 
      });
        // Actualiza contexto con el nuevo nombre
      if (login) {
        login(
          localStorage.getItem("token") || "", 
          user!.role, 
          user!.email, 
          response.user.name
        );
      }

      alert("¡Perfil actualizado con éxito!");
      setPassword('');
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Editar Perfil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Nombre</label>
            <input 
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="..."
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Nueva Contraseña</label>
            <input 
              type="password"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Dejar en blanco para no cambiar"
            />
            <p className="text-[10px] text-gray-400 mt-1 italic">Mínimo 6 caracteres si decides cambiarla.</p>
          </div>
          
          <div className="pt-4 flex flex-col gap-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 rounded-md font-bold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
            >
              {loading ? "Procesando..." : "Guardar Cambios"}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors py-1"
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}