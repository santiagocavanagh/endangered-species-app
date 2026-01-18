import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Label } from './ui/label';
import { X, Lock, Mail, Loader2 } from 'lucide-react';
import { cn } from './ui/utils';

export function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      login(data.token, data.role, data.email);
      onClose();
    } catch (err) {
      alert("Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200")}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bienvenido</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all text-sm"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-2.5 rounded-md font-semibold hover:bg-green-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar a EcoGuard"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acceso restringido a personal autorizado y exploradores registrados.
          </p>
        </div>
      </div>
    </div>
  );
}