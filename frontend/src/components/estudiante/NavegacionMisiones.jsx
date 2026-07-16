import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, PlayCircle, FileText, FileVideo, Music } from 'lucide-react';

export default function NavegacionMisiones({ misiones, progreso, bloqueActivo, onSelectBloque }) {
  const [misionesExpandidas, setMisionesExpandidas] = useState({});

  const toggleMision = (misionId) => {
    setMisionesExpandidas(prev => ({
      ...prev,
      [misionId]: !prev[misionId]
    }));
  };

  const getIconoBloque = (tipo) => {
    switch (tipo) {
      case 'video_youtube': return <PlayCircle className="w-4 h-4" />;
      case 'texto_markdown': return <FileText className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'documento_drive': return <FileVideo className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const bloquesCompletados = progreso?.bloques_completados?.map(b => b.bloque_id) || [];
  
  // Determinar hasta qué bloque tiene acceso (Desbloqueo estricto)
  // El usuario tiene acceso a todos los completados, y al SIGUIENTE inmediatamente después del último completado.
  // Asumimos orden lineal:
  const todosLosBloques = misiones.flatMap(m => m.bloques || []);
  let primerBloqueIncompletoIdx = todosLosBloques.findIndex(b => !bloquesCompletados.includes(b.id));
  if (primerBloqueIncompletoIdx === -1) primerBloqueIncompletoIdx = todosLosBloques.length; // Terminó todo

  return (
    <div className="p-2 space-y-1">
      {misiones.map((mision, mIdx) => {
        // Expandir por defecto si contiene el bloque activo
        const contieneActivo = mision.bloques?.some(b => b.id === bloqueActivo?.id);
        const estaExpandida = misionesExpandidas[mision.id] !== false && (contieneActivo || misionesExpandidas[mision.id]);

        return (
          <div key={mision.id} className="mb-2">
            <button
              onClick={() => toggleMision(mision.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-400">
                  {mIdx + 1}
                </div>
                <span className="font-medium text-sm text-gray-200 line-clamp-1">{mision.titulo}</span>
              </div>
              {estaExpandida ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {estaExpandida && (
              <div className="pl-4 pr-2 mt-1 space-y-1">
                {(mision.bloques || []).map((bloque) => {
                  const isActivo = bloqueActivo?.id === bloque.id;
                  const isCompletado = bloquesCompletados.includes(bloque.id);
                  
                  // Lógica de desbloqueo:
                  const idxGlobal = todosLosBloques.findIndex(b => b.id === bloque.id);
                  const isBloqueado = idxGlobal > primerBloqueIncompletoIdx;

                  return (
                    <button
                      key={bloque.id}
                      disabled={isBloqueado}
                      onClick={() => onSelectBloque(bloque)}
                      className={`
                        w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all
                        ${isActivo ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-gray-800/50 text-gray-400'}
                        ${isBloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompletado ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : isBloqueado ? (
                          <Lock className="w-4 h-4 text-gray-600" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 ${isActivo ? 'border-brand-primary' : 'border-gray-600'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className={`text-sm font-medium line-clamp-2 ${isActivo ? 'text-white' : (isBloqueado ? 'text-gray-600' : 'text-gray-300')}`}>
                          {bloque.titulo}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs opacity-70">
                          {getIconoBloque(bloque.tipo)}
                          <span>{bloque.duracion_estimada_min} min</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
