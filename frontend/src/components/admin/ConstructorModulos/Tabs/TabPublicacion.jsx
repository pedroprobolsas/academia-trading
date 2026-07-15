import { useAuth } from '../../../../context/AuthContext';
import { Rocket, Archive, Copy, AlertTriangle } from 'lucide-react';

export default function TabPublicacion({ modulo, updateModuloData }) {
  const { token } = useAuth();
  const meta = modulo.metadata || {};
  const checklist = meta.checklist_editorial || {};

  const handleChecklistChange = (key, value) => {
    updateModuloData({
      metadata: {
        checklist_editorial: { ...checklist, [key]: value }
      }
    });
  };

  const handlePublicar = async () => {
    if (!confirm('¿Publicar este módulo? Una vez publicado, se vuelve inmutable. Para editarlo deberás crear una nueva versión.')) return;
    try {
      const res = await fetch(`/api/admin/modulos/${modulo.id}/publicar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Error publicando');
        return;
      }
      // Recargar
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNuevaVersion = async () => {
    if (!confirm('¿Crear nueva versión borrador de este módulo? Se clonará toda su estructura (misiones, bloques, etc.) para que puedas editarla sin afectar la versión publicada.')) return;
    try {
      const res = await fetch(`/api/admin/modulos/${modulo.id}/nueva_version`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Error creando versión');
        return;
      }
      const newMod = await res.json();
      window.location.href = `/admin/modulos/${newMod.id}/editar`;
    } catch (e) {
      console.error(e);
    }
  };

  const CHECKLIST_ITEMS = [
    { key: 'contenido_revisado', label: 'Contenido revisado y sin errores' },
    { key: 'videos_subidos', label: 'Videos finales subidos' },
    { key: 'quiz_creado', label: 'Quiz de evaluación creado' },
    { key: 'practica_definida', label: 'Práctica definida con criterios claros' },
    { key: 'transformacion_clara', label: 'Promesa de transformación definida' },
    { key: 'orden_correcto', label: 'Orden de misiones y bloques verificado' },
  ];

  const completados = CHECKLIST_ITEMS.filter(item => checklist[item.key]).length;
  const totalChecklist = CHECKLIST_ITEMS.length;
  const porcentaje = Math.round((completados / totalChecklist) * 100);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Publicación</h2>
        <p className="text-gray-500 text-sm">Revisa el checklist editorial y controla el ciclo de vida del módulo.</p>
      </div>

      {/* Estado actual */}
      <div className="bg-[#1e2124] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Estado Actual</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            modulo.estado === 'borrador' ? 'bg-yellow-900/40 text-yellow-500' :
            modulo.estado === 'publicado' ? 'bg-green-900/40 text-green-500' :
            'bg-gray-800 text-gray-400'
          }`}>
            {modulo.estado?.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Versión</span>
            <p className="text-white font-medium">v{modulo.version}</p>
          </div>
          <div>
            <span className="text-gray-500">Creado</span>
            <p className="text-white font-medium">{modulo.created_at ? new Date(modulo.created_at).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Publicado</span>
            <p className="text-white font-medium">{modulo.publicado_at ? new Date(modulo.publicado_at).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>

      {/* Checklist Editorial */}
      <div className="bg-[#1e2124] border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Checklist Editorial</h3>
          <span className="text-sm text-gray-400">{completados}/{totalChecklist} ({porcentaje}%)</span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-brand-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <div className="space-y-2">
          {CHECKLIST_ITEMS.map(item => (
            <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={checklist[item.key] || false}
                onChange={(e) => handleChecklistChange(item.key, e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-brand-accent focus:ring-brand-accent w-4 h-4"
              />
              <span className={`text-sm ${checklist[item.key] ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        {modulo.estado === 'borrador' && (
          <button
            onClick={handlePublicar}
            className="w-full flex items-center justify-center gap-3 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors"
          >
            <Rocket className="w-5 h-5" /> Publicar Módulo
          </button>
        )}

        {modulo.estado === 'publicado' && (
          <>
            <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">Este módulo está publicado y es <strong>inmutable</strong>. Para editar su contenido, crea una nueva versión borrador.</p>
            </div>
            <button
              onClick={handleNuevaVersion}
              className="w-full flex items-center justify-center gap-3 py-3 bg-brand-accent hover:bg-[#ff9075] text-white rounded-xl font-semibold transition-colors"
            >
              <Copy className="w-5 h-5" /> Crear Nueva Versión (v{modulo.version + 1})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
