import React from 'react';

export default function TabGeneral({ modulo, updateModuloData }) {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    updateModuloData({ [name]: type === 'number' ? Number(value) : value });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-6">Información General</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Título del Módulo</label>
          <input
            type="text"
            name="titulo"
            value={modulo.titulo || ''}
            onChange={handleChange}
            placeholder="Ej. Gestión del Riesgo"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Subtítulo o Promesa</label>
          <input
            type="text"
            name="subtitulo"
            value={modulo.subtitulo || ''}
            onChange={handleChange}
            placeholder="Ej. Protege tu capital antes de buscar ganancias"
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Descripción Corta</label>
        <textarea
          name="descripcion_corta"
          value={modulo.descripcion_corta || ''}
          onChange={handleChange}
          rows="3"
          placeholder="Un resumen de 2 líneas sobre lo que trata el módulo."
          className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Nivel</label>
          <select
            name="nivel"
            value={modulo.nivel || 1}
            onChange={handleChange}
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
          >
            <option value={1}>1 - Principiante</option>
            <option value={2}>2 - Intermedio</option>
            <option value={3}>3 - Avanzado</option>
            <option value={4}>4 - Experto</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Duración Estimada (min)</label>
          <input
            type="number"
            name="duracion_estimada_min"
            value={modulo.duracion_estimada_min || ''}
            onChange={handleChange}
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Número de Orden</label>
          <input
            type="number"
            name="numero_orden"
            value={modulo.numero_orden || ''}
            onChange={handleChange}
            className="w-full bg-[#1e2124] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
