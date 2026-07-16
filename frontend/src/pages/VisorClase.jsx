import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavegacionMisiones from '../components/estudiante/NavegacionMisiones';
import VisorContenido from '../components/estudiante/VisorContenido';
import BarraProgresoClase from '../components/estudiante/BarraProgresoClase';

export default function VisorClase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [bloqueActivo, setBloqueActivo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      // 1. Obtener estructura del módulo (Usamos el endpoint público o el mismo del detalle)
      const resMod = await fetch(`/api/modulos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataMod = await resMod.json();
      
      // 2. Obtener progreso del usuario
      const resProg = await fetch(`/api/modulos/${id}/progreso`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProg = await resProg.json();

      setModulo(dataMod);
      setProgreso(dataProg);

      // Auto-seleccionar el primer bloque incompleto o el primer bloque del curso
      if (dataMod.misiones && dataMod.misiones.length > 0) {
        let bloqueASeleccionar = null;
        
        // Buscar el primer bloque que no esté en dataProg.bloquesCompletados
        const bloquesCompletados = dataProg.bloques_completados?.map(b => b.bloque_id) || [];
        
        for (const mision of dataMod.misiones) {
          for (const bloque of (mision.bloques || [])) {
            if (!bloquesCompletados.includes(bloque.id)) {
              bloqueASeleccionar = bloque;
              break;
            }
          }
          if (bloqueASeleccionar) break;
        }

        // Si ya completó todo, seleccionar el último
        if (!bloqueASeleccionar) {
          const ultimaMision = dataMod.misiones[dataMod.misiones.length - 1];
          if (ultimaMision && ultimaMision.bloques) {
            bloqueASeleccionar = ultimaMision.bloques[ultimaMision.bloques.length - 1];
          }
        }

        setBloqueActivo(bloqueASeleccionar);
      }
    } catch (error) {
      console.error("Error cargando clase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [id]);

  const handleBloqueCompletado = async () => {
    // Recargar progreso para actualizar candados
    await fetchDatos();
    // Nota: El auto-seleccionar avanzará automáticamente al siguiente bloque
  };

  if (isLoading) return <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-primary"></div></div>;
  if (!modulo) return <div className="text-white text-center p-8">Módulo no encontrado</div>;

  return (
    <div className="flex h-screen bg-[#0A0C0F] text-white overflow-hidden">
      {/* Sidebar Izquierdo */}
      <div className="w-80 bg-[#141617] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <button onClick={() => navigate(`/modulos/${id}`)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="font-semibold text-sm line-clamp-1">{modulo.titulo}</h1>
            <div className="text-xs text-brand-primary font-medium mt-0.5">{progreso?.progreso_porcentaje || 0}% Completado</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <NavegacionMisiones 
            misiones={modulo.misiones || []} 
            progreso={progreso} 
            bloqueActivo={bloqueActivo}
            onSelectBloque={setBloqueActivo}
          />
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col relative bg-[#0F1113]">
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          {bloqueActivo ? (
            <VisorContenido bloque={bloqueActivo} />
          ) : (
            <div className="text-gray-500 text-center mt-20">Selecciona un contenido del menú</div>
          )}
        </div>

        {/* Footer flotante de controles */}
        {bloqueActivo && (
          <BarraProgresoClase 
            bloqueActivo={bloqueActivo} 
            progreso={progreso}
            onCompletado={handleBloqueCompletado}
          />
        )}
      </div>
    </div>
  );
}
