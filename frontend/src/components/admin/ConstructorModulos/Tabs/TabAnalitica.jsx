export default function TabAnalitica({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const analitica = meta.analitica || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        analitica: { ...analitica, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Analítica</h2>
        <p className="text-gray-500 text-sm">Configura métricas y eventos de seguimiento para este módulo.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">KPIs del Módulo</label>
        <textarea
          value={analitica.kpis || ''}
          onChange={(e) => handleChange('kpis', e.target.value)}
          rows="3"
          placeholder="Ej.&#10;Tasa de completado > 80%&#10;Puntaje promedio en quiz > 75%&#10;Tiempo promedio < 45 min"
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Eventos a Rastrear</label>
        <textarea
          value={analitica.eventos || ''}
          onChange={(e) => handleChange('eventos', e.target.value)}
          rows="3"
          placeholder="Ej.&#10;video_completado&#10;quiz_aprobado&#10;practica_entregada&#10;modulo_abandonado"
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Alertas Automáticas</label>
        <textarea
          value={analitica.alertas || ''}
          onChange={(e) => handleChange('alertas', e.target.value)}
          rows="2"
          placeholder="Ej. Si un alumno falla el quiz 3 veces, enviar alerta al instructor."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>
    </div>
  );
}
