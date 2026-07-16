import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function VisorContenido({ bloque }) {
  if (!bloque || !bloque.config) return null;

  const { tipo, config } = bloque;

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      let videoId = '';
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">{bloque.titulo}</h1>
        {bloque.descripcion && (
          <p className="text-gray-400 mt-2 text-lg">{bloque.descripcion}</p>
        )}
      </div>

      <div className="bg-[#141617] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {tipo === 'video_youtube' && (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={getYoutubeEmbedUrl(config.url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={bloque.titulo}
            />
          </div>
        )}

        {tipo === 'texto_markdown' && (
          <div className="p-8 lg:p-12 prose prose-invert prose-brand max-w-none">
            <ReactMarkdown>{config.markdown || ''}</ReactMarkdown>
          </div>
        )}

        {tipo === 'audio' && (
          <div className="p-12 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-b from-[#1A1C1E] to-[#141617]">
            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </div>
            <audio controls className="w-full max-w-md custom-audio-player">
              <source src={config.url} type="audio/mpeg" />
              Tu navegador no soporta el reproductor de audio.
            </audio>
          </div>
        )}

        {tipo === 'imagen' && (
          <div className="p-4 bg-black flex justify-center items-center">
             <img src={config.url} alt={bloque.titulo} className="max-w-full h-auto max-h-[70vh] rounded-lg object-contain" />
          </div>
        )}

        {tipo === 'documento_drive' && (
          <div className="p-12 text-center bg-gradient-to-b from-[#1A1C1E] to-[#141617] border-y border-gray-800">
             <svg className="w-16 h-16 text-yellow-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             <h3 className="text-xl font-semibold text-white mb-2">Material de Lectura</h3>
             <p className="text-gray-400 mb-6">Descarga o visualiza el documento para continuar.</p>
             <a href={config.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-colors">
               Abrir Documento
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
          </div>
        )}
      </div>
    </div>
  );
}
