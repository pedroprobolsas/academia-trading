export default function TabRetencion({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const retencion = meta.retencion || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        retencion: { ...retencion, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Retención</h2>
        <p className="text-gray-500 text-sm">Configura estrategias para reforzar el aprendizaje y prevenir el olvido.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Resumen Ejecutivo (para repaso rápido)</label>
        <textarea
          value={retencion.resumen || ''}
          onChange={(e) => handleChange('resumen', e.target.value)}
          rows="4"
          placeholder="Un resumen de los puntos clave que el alumno debe recordar. Se usará en el sistema de repaso espaciado."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Reglas Mnemónicas / Anclas de Memoria</label>
        <textarea
          value={retencion.mnemotecnias || ''}
          onChange={(e) => handleChange('mnemotecnias', e.target.value)}
          rows="3"
          placeholder="Ej. 'Nunca arriesgues más del 2% por operación' — Regla del 2%."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Días para Primer Repaso</label>
          <input
            type="number"
            min="1"
            value={retencion.dias_primer_repaso || ''}
            onChange={(e) => handleChange('dias_primer_repaso', Number(e.target.value))}
            placeholder="3"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Frecuencia de Repaso (días)</label>
          <input
            type="number"
            min="1"
            value={retencion.frecuencia_repaso || ''}
            onChange={(e) => handleChange('frecuencia_repaso', Number(e.target.value))}
            placeholder="7"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
