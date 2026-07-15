import { useState, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { 
  Plus, ChevronDown, ChevronRight, GripVertical, Trash2, 
  Video, FileText, Headphones, FolderOpen, Image, Code, 
  HelpCircle, Loader2, AlertCircle
} from 'lucide-react';
import BloqueItem from '../BloqueItem';

const TIPOS_BLOQUE = [
  { id: 'video_youtube', label: 'Video YouTube', icon: Video, color: 'text-red-400' },
  { id: 'texto_markdown', label: 'Texto / Markdown', icon: FileText, color: 'text-blue-400' },
  { id: 'audio', label: 'Audio', icon: Headphones, color: 'text-purple-400' },
  { id: 'documento_drive', label: 'Google Drive', icon: FolderOpen, color: 'text-yellow-400' },
  { id: 'imagen', label: 'Imagen', icon: Image, color: 'text-green-400' },
  { id: 'embed', label: 'Embed / Widget', icon: Code, color: 'text-cyan-400' },
  { id: 'quiz_inline', label: 'Quiz Inline', icon: HelpCircle, color: 'text-orange-400' },
];

export default function TabMisiones({ modulo, updateModuloData }) {
  const { token } = useAuth();
  const [misiones, setMisiones] = useState(modulo.misiones || []);
  const [expandedMision, setExpandedMision] = useState(null);
  const [creatingMision, setCreatingMision] = useState(false);
  const [creatingBloque, setCreatingBloque] = useState(null); // mision_id
  const [showTipoPicker, setShowTipoPicker] = useState(null); // mision_id para el picker

  // Drag state
  const dragMisionRef = useRef(null);
  const dragBloqueRef = useRef(null);

  const apiHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // --- MISIONES CRUD ---
  const handleCrearMision = async () => {
    setCreatingMision(true);
    try {
      const res = await fetch(`/api/admin/modulos/${modulo.id}/misiones`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ titulo: 'Nueva Misión', tipo: 'explicacion' })
      });
      if (!res.ok) throw new Error('Error creando misión');
      const nueva = await res.json();
      nueva.bloques = [];
      setMisiones(prev => [...prev, nueva]);
      setExpandedMision(nueva.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingMision(false);
    }
  };

  const handleUpdateMision = async (misionId, updates) => {
    // Actualización optimista
    setMisiones(prev => prev.map(m => m.id === misionId ? { ...m, ...updates } : m));
    try {
      await fetch(`/api/admin/misiones/${misionId}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Error guardando misión:', e);
    }
  };

  const handleEliminarMision = async (misionId) => {
    if (!confirm('¿Eliminar esta misión y todos sus bloques? Esta acción no se puede deshacer.')) return;
    try {
      await fetch(`/api/admin/misiones/${misionId}`, { method: 'DELETE', headers: apiHeaders });
      setMisiones(prev => prev.filter(m => m.id !== misionId));
    } catch (e) {
      console.error(e);
    }
  };

  // --- BLOQUES CRUD ---
  const handleCrearBloque = async (misionId, tipo) => {
    setCreatingBloque(misionId);
    setShowTipoPicker(null);
    try {
      const res = await fetch(`/api/admin/misiones/${misionId}/bloques`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ tipo, titulo: `Nuevo ${TIPOS_BLOQUE.find(t => t.id === tipo)?.label || 'Bloque'}` })
      });
      if (!res.ok) throw new Error('Error creando bloque');
      const nuevo = await res.json();
      setMisiones(prev => prev.map(m => {
        if (m.id !== misionId) return m;
        return { ...m, bloques: [...(m.bloques || []), nuevo] };
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingBloque(null);
    }
  };

  const handleUpdateBloque = async (bloqueId, misionId, updates) => {
    // Optimista
    setMisiones(prev => prev.map(m => {
      if (m.id !== misionId) return m;
      return { ...m, bloques: (m.bloques || []).map(b => b.id === bloqueId ? { ...b, ...updates } : b) };
    }));
    try {
      await fetch(`/api/admin/bloques/${bloqueId}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Error guardando bloque:', e);
    }
  };

  const handleEliminarBloque = async (bloqueId, misionId) => {
    if (!confirm('¿Eliminar este bloque de contenido?')) return;
    try {
      await fetch(`/api/admin/bloques/${bloqueId}`, { method: 'DELETE', headers: apiHeaders });
      setMisiones(prev => prev.map(m => {
        if (m.id !== misionId) return m;
        return { ...m, bloques: (m.bloques || []).filter(b => b.id !== bloqueId) };
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // --- DRAG & DROP MISIONES (HTML5 nativo) ---
  const handleMisionDragStart = (e, index) => {
    dragMisionRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleMisionDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMisionDrop = async (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = dragMisionRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    const reordered = [...misiones];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setMisiones(reordered);

    // Persistir
    const ordenes = reordered.map((m, i) => ({ id: m.id, numero_orden: i + 1 }));
    try {
      await fetch(`/api/admin/modulos/${modulo.id}/misiones/orden`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ ordenes })
      });
    } catch (e) {
      console.error('Error reordenando misiones:', e);
    }
    dragMisionRef.current = null;
  };

  const handleMisionDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    dragMisionRef.current = null;
  };

  // --- DRAG & DROP BLOQUES ---
  const handleBloqueDragStart = (e, misionId, bloqueIndex) => {
    dragBloqueRef.current = { misionId, bloqueIndex };
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleBloqueDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleBloqueDrop = async (e, targetMisionId, targetIndex) => {
    e.preventDefault();
    const source = dragBloqueRef.current;
    if (!source) return;

    // Solo reordenamos dentro de la misma misión por ahora
    if (source.misionId !== targetMisionId) return;

    const mision = misiones.find(m => m.id === targetMisionId);
    if (!mision) return;

    const bloques = [...(mision.bloques || [])];
    const [moved] = bloques.splice(source.bloqueIndex, 1);
    bloques.splice(targetIndex, 0, moved);

    setMisiones(prev => prev.map(m => m.id === targetMisionId ? { ...m, bloques } : m));

    // Persistir
    const ordenes = bloques.map((b, i) => ({ id: b.id, numero_orden: i + 1 }));
    try {
      await fetch(`/api/admin/misiones/${targetMisionId}/bloques/orden`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ ordenes })
      });
    } catch (e) {
      console.error('Error reordenando bloques:', e);
    }
    dragBloqueRef.current = null;
  };

  const handleBloqueDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    dragBloqueRef.current = null;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading">Misiones y Contenidos</h2>
          <p className="text-gray-500 text-sm mt-1">Estructura el recorrido del alumno en misiones secuenciales, cada una con sus bloques de contenido.</p>
        </div>
        <button
          onClick={handleCrearMision}
          disabled={creatingMision}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-[#ff9075] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {creatingMision ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Nueva Misión
        </button>
      </div>

      {misiones.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-xl">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Este módulo no tiene misiones aún.</p>
          <p className="text-gray-600 text-sm mt-1">Crea la primera misión para comenzar a estructurar el contenido.</p>
        </div>
      )}

      {/* Lista de Misiones */}
      <div className="space-y-3">
        {misiones.map((mision, mIndex) => {
          const isExpanded = expandedMision === mision.id;
          const bloques = mision.bloques || [];

          return (
            <div
              key={mision.id}
              draggable
              onDragStart={(e) => handleMisionDragStart(e, mIndex)}
              onDragOver={(e) => handleMisionDragOver(e, mIndex)}
              onDrop={(e) => handleMisionDrop(e, mIndex)}
              onDragEnd={handleMisionDragEnd}
              className="bg-[#1e2124] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700"
            >
              {/* Header de la Misión */}
              <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpandedMision(isExpanded ? null : mision.id)}>
                <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400" onClick={(e) => e.stopPropagation()}>
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-brand-accent" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={mision.titulo || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateMision(mision.id, { titulo: e.target.value })}
                    className="w-full bg-transparent text-white font-semibold focus:outline-none focus:bg-[#141617] focus:px-2 focus:py-1 focus:rounded transition-all placeholder-gray-600"
                    placeholder="Título de la misión"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-gray-800 px-2 py-1 rounded">{bloques.length} bloque{bloques.length !== 1 ? 's' : ''}</span>
                  <select
                    value={mision.tipo || 'explicacion'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateMision(mision.id, { tipo: e.target.value })}
                    className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded border-none focus:outline-none"
                  >
                    <option value="explicacion">Explicación</option>
                    <option value="practica">Práctica</option>
                    <option value="evaluacion">Evaluación</option>
                    <option value="reflexion">Reflexión</option>
                  </select>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleEliminarMision(mision.id); }}
                  className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar misión"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido expandido: Bloques */}
              {isExpanded && (
                <div className="border-t border-gray-800 bg-[#191c1e] p-4 space-y-3">
                  {/* Objetivo de la misión */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Objetivo de la Misión</label>
                    <textarea
                      value={mision.objetivo || ''}
                      onChange={(e) => handleUpdateMision(mision.id, { objetivo: e.target.value })}
                      rows="2"
                      placeholder="¿Qué debería lograr el alumno al completar esta misión?"
                      className="w-full mt-1 bg-[#141617] border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
                    />
                  </div>

                  {/* Lista de Bloques */}
                  {bloques.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-gray-800 rounded-lg">
                      <p className="text-gray-600 text-sm">Sin bloques de contenido. Agrega el primer bloque.</p>
                    </div>
                  )}

                  {bloques.map((bloque, bIndex) => (
                    <div
                      key={bloque.id}
                      draggable
                      onDragStart={(e) => handleBloqueDragStart(e, mision.id, bIndex)}
                      onDragOver={handleBloqueDragOver}
                      onDrop={(e) => handleBloqueDrop(e, mision.id, bIndex)}
                      onDragEnd={handleBloqueDragEnd}
                    >
                      <BloqueItem
                        bloque={bloque}
                        tiposBloque={TIPOS_BLOQUE}
                        onUpdate={(updates) => handleUpdateBloque(bloque.id, mision.id, updates)}
                        onDelete={() => handleEliminarBloque(bloque.id, mision.id)}
                      />
                    </div>
                  ))}

                  {/* Botón Agregar Bloque con Picker de Tipo */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTipoPicker(showTipoPicker === mision.id ? null : mision.id)}
                      disabled={creatingBloque === mision.id}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 hover:border-brand-accent/50 rounded-lg text-gray-500 hover:text-brand-accent transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {creatingBloque === mision.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Agregar Bloque de Contenido
                    </button>

                    {/* Tipo Picker Dropdown */}
                    {showTipoPicker === mision.id && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e2124] border border-gray-700 rounded-xl shadow-2xl p-2 z-20 grid grid-cols-2 gap-1">
                        {TIPOS_BLOQUE.map(tipo => {
                          const Icon = tipo.icon;
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => handleCrearBloque(mision.id, tipo.id)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left"
                            >
                              <Icon className={`w-4 h-4 ${tipo.color}`} />
                              <span className="text-sm text-gray-300">{tipo.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
