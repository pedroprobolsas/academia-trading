import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Save } from 'lucide-react';

export default function ModuloForm({ modulo, onClose, onSaved }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    numero_orden: '',
    titulo: '',
    descripcion: '',
    nivel: 1,
    duracion_estimada_min: 30,
    youtube_url: '',
    drive_url: '',
    audio_url: '',
    contenido_texto: '',
    formato_principal: 'video'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (modulo) {
      setFormData({
        numero_orden: modulo.numero_orden || '',
        titulo: modulo.titulo || '',
        descripcion: modulo.descripcion || '',
        nivel: modulo.nivel || 1,
        duracion_estimada_min: modulo.duracion_estimada_min || 30,
        youtube_url: modulo.youtube_url || '',
        drive_url: modulo.drive_url || '',
        audio_url: modulo.audio_url || '',
        contenido_texto: modulo.contenido_texto || '',
        formato_principal: modulo.formato_principal || 'video'
      });
    }
  }, [modulo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isEditing = !!modulo?.id;
    const url = isEditing ? `/api/admin/modulos/${modulo.id}` : '/api/admin/modulos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el módulo');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-[#1e2124] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-heading font-bold text-white">
            {modulo?.id ? 'Editar Módulo' : 'Nuevo Módulo'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Número de Orden</label>
              <input 
                type="number" required min="1"
                name="numero_orden" value={formData.numero_orden} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nivel (1-4)</label>
              <input 
                type="number" required min="1" max="4"
                name="nivel" value={formData.nivel} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
            <input 
              type="text" required
              name="titulo" value={formData.titulo} onChange={handleChange}
              className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descripción Corta</label>
            <textarea 
              name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2"
              className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Duración (min)</label>
              <input 
                type="number" required min="1"
                name="duracion_estimada_min" value={formData.duracion_estimada_min} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-accent mb-1">Formato Principal</label>
              <select 
                name="formato_principal" value={formData.formato_principal} onChange={handleChange}
                className="w-full bg-[#141617] border border-brand-accent/50 rounded-lg p-2 text-white"
              >
                <option value="video">Video (YouTube)</option>
                <option value="audio">Audio (MinIO)</option>
                <option value="documento">Documento (Drive)</option>
                <option value="texto">Solo Texto</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4 space-y-4">
            <h4 className="text-white font-medium">Contenidos Multimedia</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enlace de YouTube</label>
              <input 
                type="url" placeholder="https://youtu.be/..."
                name="youtube_url" value={formData.youtube_url} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enlace de Drive (PDF/Doc)</label>
              <input 
                type="url" placeholder="https://drive.google.com/..."
                name="drive_url" value={formData.drive_url} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enlace de Audio (MinIO)</label>
              <input 
                type="text" placeholder="clase-1.mp3"
                name="audio_url" value={formData.audio_url} onChange={handleChange}
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white focus:border-brand-accent focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Solo el nombre del archivo, no la URL completa</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Contenido de Texto (Notas)</label>
              <textarea 
                name="contenido_texto" value={formData.contenido_texto} onChange={handleChange} rows="4"
                placeholder="Escribe el texto detallado del módulo aquí..."
                className="w-full bg-[#141617] border border-gray-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-[#ff9075] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Módulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
