export default function TabPractica({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const practica = meta.practica || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        practica: { ...practica, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Práctica</h2>
        <p className="text-gray-500 text-sm">Define ejercicios y tareas prácticas vinculadas a este módulo.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Instrucciones de Práctica</label>
        <textarea
          value={practica.instrucciones || ''}
          onChange={(e) => handleChange('instrucciones', e.target.value)}
          rows="4"
          placeholder="Describe la actividad práctica: qué debe hacer el alumno, con qué instrumento, en qué temporalidad, etc."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Criterios de Éxito</label>
        <textarea
          value={practica.criterios_exito || ''}
          onChange={(e) => handleChange('criterios_exito', e.target.value)}
          rows="3"
          placeholder="¿Qué evidencia demuestra que el alumno completó exitosamente la práctica? Ej. Subir screenshot del journal con 3 operaciones calculadas."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Tipo de Práctica</label>
          <select
            value={practica.tipo || 'demo'}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
          >
            <option value="demo">Cuenta Demo</option>
            <option value="simulador">Simulador Interno</option>
            <option value="journal">Registro en Journal</option>
            <option value="calculo">Cálculo Manual</option>
            <option value="analisis">Análisis de Gráficos</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Operaciones Mínimas</label>
          <input
            type="number"
            value={practica.operaciones_minimas || ''}
            onChange={(e) => handleChange('operaciones_minimas', Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
