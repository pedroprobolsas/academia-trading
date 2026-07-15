import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Book, Lock, CheckCircle, PlayCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Curriculum() {
  const { token } = useAuth();
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const res = await fetch('http://localhost:3001/modulos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setModulos(data);
      } catch (err) {
        console.error('Error fetching modulos', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModulos();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-gray-400">Cargando currículum...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex items-center gap-4">
        <div className="p-4 bg-brand-accent/10 rounded-xl">
          <Book className="w-10 h-10 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Currículum</h1>
          <p className="text-gray-400">Sigue la ruta de aprendizaje para dominar los índices sintéticos.</p>
        </div>
      </header>

      <div className="space-y-4">
        {modulos.map((mod) => {
          const isBlocked = mod.estado === 'bloqueado';
          const isCompleted = mod.estado === 'completado';
          const isAvailable = mod.estado === 'disponible';

          return (
            <div 
              key={mod.id} 
              onClick={() => !isBlocked && navigate(`/modulos/${mod.id}`)}
              className={`flex flex-col md:flex-row gap-6 p-6 rounded-2xl border transition-all ${
                isBlocked 
                  ? 'bg-[#141617] border-gray-800 opacity-60 cursor-not-allowed' 
                  : 'bg-[#1e2124] border-gray-700 hover:border-brand-accent cursor-pointer hover:shadow-[0_0_20px_rgba(253,123,91,0.1)]'
              }`}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 border border-gray-700 font-heading font-bold text-2xl text-gray-400">
                {mod.numero_orden}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-bold font-heading ${isBlocked ? 'text-gray-500' : 'text-white'}`}>
                    {mod.titulo}
                  </h3>
                  {isBlocked && <Lock className="w-6 h-6 text-gray-600" />}
                  {isCompleted && <CheckCircle className="w-6 h-6 text-green-400" />}
                </div>
                <p className={`${isBlocked ? 'text-gray-600' : 'text-gray-400'} text-sm mb-4 line-clamp-2`}>
                  {mod.descripcion}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className={`px-2 py-1 rounded flex items-center gap-1 ${isBlocked ? 'bg-gray-800 text-gray-500' : 'bg-gray-800 text-gray-300'}`}>
                    Nivel {mod.nivel}
                  </span>
                  <span className={`flex items-center gap-1 ${isBlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    <Clock className="w-4 h-4" /> {mod.duracion_estimada_min} min
                  </span>
                  {isAvailable && (
                    <span className="ml-auto text-brand-accent flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" /> Empezar Clase
                    </span>
                  )}
                  {isCompleted && (
                    <span className="ml-auto text-gray-400 flex items-center gap-1">
                      Repasar
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
