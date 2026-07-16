import { useState } from 'react';
import { 
  GripVertical, Trash2, ChevronDown, ChevronRight,
  Video, FileText, Headphones, FolderOpen, Image, Code, HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  video_youtube: Video,
  texto_markdown: FileText,
  audio: Headphones,
  documento_drive: FolderOpen,
  imagen: Image,
  embed: Code,
  quiz_inline: HelpCircle,
};

const COLOR_MAP = {
  video_youtube: 'border-l-red-500',
  texto_markdown: 'border-l-blue-500',
  audio: 'border-l-purple-500',
  documento_drive: 'border-l-yellow-500',
  imagen: 'border-l-green-500',
  embed: 'border-l-cyan-500',
  quiz_inline: 'border-l-orange-500',
};

const ICON_COLOR_MAP = {
  video_youtube: 'text-red-400',
  texto_markdown: 'text-blue-400',
  audio: 'text-purple-400',
  documento_drive: 'text-yellow-400',
  imagen: 'text-green-400',
  embed: 'text-cyan-400',
  quiz_inline: 'text-orange-400',
};

export default function BloqueItem({ bloque, tiposBloque, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = ICON_MAP[bloque.tipo] || FileText;
  const borderColor = COLOR_MAP[bloque.tipo] || 'border-l-gray-500';
  const iconColor = ICON_COLOR_MAP[bloque.tipo] || 'text-gray-400';

  const config = bloque.config || {};

  const handleConfigChange = (key, value) => {
    onUpdate({ config: { ...config, [key]: value } });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e, keyToUpdate) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('archivo', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/modulos/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        onUpdate({ config: { ...config, [keyToUpdate]: data.url } });
      } else {
        alert('Error subiendo archivo: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al subir archivo');
    } finally {
      setIsUploading(false);
    }
  };

  // Renderizar campos específicos del tipo de bloque
  const renderConfigFields = () => {
    switch (bloque.tipo) {
      case 'video_youtube':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">URL de YouTube</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => onUpdate({ config: { ...config, url: e.target.value } })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            {config.url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getYoutubeEmbedUrl(config.url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  title="Preview"
                />
              </div>
            )}
          </div>
        );

      case 'texto_markdown':
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Contenido de Texto</label>
            <textarea
              value={config.markdown || ''}
              onChange={(e) => onUpdate({ config: { ...config, markdown: e.target.value } })}
              rows="8"
              placeholder="Escribe el contenido aquí. Soporta Markdown."
              className="w-full bg-[#141617] border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-y font-mono"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">URL del Audio (o Súbelo)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => onUpdate({ config: { ...config, url: e.target.value } })}
                placeholder="https://..."
                className="flex-1 bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center whitespace-nowrap">
                {isUploading ? 'Subiendo...' : 'Subir Audio'}
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'url')} disabled={isUploading} />
              </label>
            </div>
          </div>
        );

      case 'documento_drive':
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">URL del PDF / Documento (o Súbelo)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => onUpdate({ config: { ...config, url: e.target.value } })}
                placeholder="https://..."
                className="flex-1 bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
              <label className="cursor-pointer bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center whitespace-nowrap">
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'url')} disabled={isUploading} />
              </label>
            </div>
          </div>
        );

      case 'imagen':
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">URL de la imagen (o Súbela)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => onUpdate({ config: { ...config, url: e.target.value } })}
                placeholder="https://..."
                className="flex-1 bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
              />
              <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center whitespace-nowrap">
                {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'url')} disabled={isUploading} />
              </label>
            </div>
            {config.url && (
              <img src={config.url} alt="Preview" className="mt-2 rounded-lg max-h-48 object-contain bg-black" />
            )}
          </div>
        );

      case 'embed':
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Código Embed (iframe, widget, etc.)</label>
            <textarea
              value={config.html || ''}
              onChange={(e) => onUpdate({ config: { ...config, html: e.target.value } })}
              rows="4"
              placeholder='<iframe src="..." />'
              className="w-full bg-[#141617] border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-y font-mono"
            />
          </div>
        );

      case 'quiz_inline':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Pregunta</label>
              <input
                type="text"
                value={config.pregunta || ''}
                onChange={(e) => onUpdate({ config: { ...config, pregunta: e.target.value } })}
                placeholder="¿Cuál es el ratio mínimo de riesgo-recompensa?"
                className="w-full bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Respuesta Correcta</label>
              <input
                type="text"
                value={config.respuesta || ''}
                onChange={(e) => onUpdate({ config: { ...config, respuesta: e.target.value } })}
                placeholder="1:2"
                className="w-full bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
          </div>
        );

      default:
        return <p className="text-gray-600 text-sm">Tipo de bloque desconocido: {bloque.tipo}</p>;
    }
  };

  return (
    <div className={`bg-[#1a1d20] border border-gray-800 rounded-lg overflow-hidden border-l-4 ${borderColor} transition-all hover:border-gray-700`}>
      {/* Header del Bloque */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-4 h-4" />
        </div>

        <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={bloque.titulo || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ titulo: e.target.value })}
            className="w-full bg-transparent text-sm text-white font-medium focus:outline-none focus:bg-[#141617] focus:px-2 focus:py-1 focus:rounded transition-all placeholder-gray-600"
            placeholder="Título del bloque"
          />
        </div>

        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
            title="Eliminar bloque"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Config expandida */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Descripción general del bloque */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Descripción del Bloque</label>
            <input
              type="text"
              value={bloque.descripcion || ''}
              onChange={(e) => onUpdate({ descripcion: e.target.value })}
              placeholder="Instrucciones o contexto para el alumno"
              className="w-full bg-[#141617] border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent/50 transition-colors"
            />
          </div>

          {/* Campos específicos del tipo */}
          {renderConfigFields()}

          {/* Opciones comunes */}
          <div className="flex items-center gap-6 pt-2 border-t border-gray-800">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={bloque.obligatorio ?? true}
                onChange={(e) => onUpdate({ obligatorio: e.target.checked })}
                className="rounded border-gray-600 bg-gray-800 text-brand-accent focus:ring-brand-accent"
              />
              Obligatorio
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Duración (min)</label>
              <input
                type="number"
                value={bloque.duracion_estimada_min || ''}
                onChange={(e) => onUpdate({ duracion_estimada_min: Number(e.target.value) })}
                className="w-16 bg-[#141617] border border-gray-800 rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-brand-accent/50"
                min="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---
function getYoutubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    let videoId = '';
    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else {
      videoId = parsed.searchParams.get('v');
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
}
