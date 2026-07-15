export default function TabInvestigacion({ modulo, updateModuloData }) {
  const meta = modulo.metadata || {};
  const investigacion = meta.investigacion || {};

  const handleChange = (key, value) => {
    updateModuloData({
      metadata: {
        investigacion: { ...investigacion, [key]: value }
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-1">Investigación e IA</h2>
        <p className="text-gray-500 text-sm">Fuentes, referencias y configuración de prompts internos para asistencia con IA.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Fuentes y Referencias</label>
        <textarea
          value={investigacion.fuentes || ''}
          onChange={(e) => handleChange('fuentes', e.target.value)}
          rows="4"
          placeholder="Lista de fuentes bibliográficas, URLs o papers de referencia para este módulo."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Prompt Interno para IA (Tutor Virtual)</label>
        <textarea
          value={investigacion.prompt_ia || ''}
          onChange={(e) => handleChange('prompt_ia', e.target.value)}
          rows="5"
          placeholder="Ej. Eres un tutor de trading de índices sintéticos. El alumno está en el módulo de Gestión del Riesgo. Responde usando solo los conceptos cubiertos hasta este punto del currículum..."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Notas Internas del Instructor</label>
        <textarea
          value={investigacion.notas_instructor || ''}
          onChange={(e) => handleChange('notas_instructor', e.target.value)}
          rows="3"
          placeholder="Notas privadas que no verá el alumno. Ideas para mejorar, feedback recibido, etc."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        />
      </div>
    </div>
  );
}
