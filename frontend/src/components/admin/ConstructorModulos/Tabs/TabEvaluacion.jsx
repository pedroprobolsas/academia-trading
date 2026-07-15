export default function TabEvaluacion({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const evaluacion = meta.evaluacion || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        evaluacion: { ...evaluacion, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Evaluación</h2>
        <p className="text-gray-500 text-sm">Configura cómo se evalúa al alumno y los criterios de aprobación. Las preguntas del quiz se gestionan en el sistema de quizzes existente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Puntaje Mínimo para Aprobar (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={evaluacion.puntaje_minimo || ''}
            onChange={(e) => handleChange('puntaje_minimo', Number(e.target.value))}
            placeholder="70"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Intentos Máximos</label>
          <input
            type="number"
            min="1"
            value={evaluacion.intentos_max || ''}
            onChange={(e) => handleChange('intentos_max', Number(e.target.value))}
            placeholder="3"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Tipo de Evaluación</label>
        <select
          value={evaluacion.tipo || 'quiz'}
          onChange={(e) => handleChange('tipo', e.target.value)}
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
        >
          <option value="quiz">Quiz de Preguntas</option>
          <option value="practica_evaluada">Práctica Evaluada</option>
          <option value="mixta">Mixta (Quiz + Práctica)</option>
          <option value="autoevaluacion">Autoevaluación</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Mensaje de Retroalimentación al Aprobar</label>
        <textarea
          value={evaluacion.mensaje_aprobacion || ''}
          onChange={(e) => handleChange('mensaje_aprobacion', e.target.value)}
          rows="2"
          placeholder="Ej. ¡Excelente! Ahora sabes calcular tu posición como un profesional."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Mensaje de Retroalimentación al No Aprobar</label>
        <textarea
          value={evaluacion.mensaje_reprobacion || ''}
          onChange={(e) => handleChange('mensaje_reprobacion', e.target.value)}
          rows="2"
          placeholder="Ej. Revisa la misión 2 sobre cálculo de lote y vuelve a intentarlo."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>
    </div>
  );
}
