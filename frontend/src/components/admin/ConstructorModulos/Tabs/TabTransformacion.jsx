export default function TabTransformacion({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const transformacion = meta.transformacion || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        transformacion: { ...transformacion, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Transformación</h2>
        <p className="text-gray-500 text-sm">Define la promesa de cambio que este módulo genera en el alumno.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Estado Inicial del Alumno (Antes)</label>
        <textarea
          value={transformacion.estado_antes || ''}
          onChange={(e) => handleChange('estado_antes', e.target.value)}
          rows="3"
          placeholder="Ej. El alumno no sabe calcular el tamaño de posición y arriesga cantidades arbitrarias."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Estado Final del Alumno (Después)</label>
        <textarea
          value={transformacion.estado_despues || ''}
          onChange={(e) => handleChange('estado_despues', e.target.value)}
          rows="3"
          placeholder="Ej. Calcula su posición en función de su stop, su capital y su riesgo máximo por operación."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Habilidades Clave que Desarrollará</label>
        <textarea
          value={transformacion.habilidades || ''}
          onChange={(e) => handleChange('habilidades', e.target.value)}
          rows="3"
          placeholder="Una habilidad por línea. Ej.&#10;Cálculo de lote&#10;Definición de stop loss&#10;Ratio riesgo-recompensa"
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Gancho Inicial</label>
        <textarea
          value={transformacion.gancho || ''}
          onChange={(e) => handleChange('gancho', e.target.value)}
          rows="2"
          placeholder="Ej. ¿Cuántas cuentas has visto explotar por no saber calcular el tamaño de posición?"
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>
    </div>
  );
}
