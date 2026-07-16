import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Lock, CheckCircle2 } from 'lucide-react';

export default function ModuloDetalle() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [modulo, setModulo] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resMod = await fetch(`/api/modulos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resMod.ok) {
          navigate('/modulos');
          return;
        }
        const dataMod = await resMod.json();
        
        const resProg = await fetch(`/api/modulos/${id}/progreso`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataProg = resProg.ok ? await resProg.json() : null;

        setModulo(dataMod);
        setProgreso(dataProg);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token, navigate]);

  if (loading || !modulo) {
    return <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-primary"></div></div>;
  }

  const bloquesCompletados = progreso?.bloques_completados?.map(b => b.bloque_id) || [];
  const porcentaje = progreso?.progreso_porcentaje || 0;

  return (
    <div className="min-h-screen bg-[#0A0C0F] p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/modulos" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Volver al Currículum
        </Link>

        {/* Header del Módulo */}
        <div className="bg-[#141617] border border-gray-800 rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl">
            {modulo.imagen_portada_object_name ? (
              <img src={`/api/modulos/imagenes/${modulo.imagen_portada_object_name}`} alt={modulo.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-6xl">
                {modulo.numero_orden}
              </div>
            )}
          </div>

          <div className="flex-1 z-10 text-center md:text-left">
            <div className="text-brand-primary font-semibold tracking-wider text-sm mb-3">MÓDULO {modulo.numero_orden}</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{modulo.titulo}</h1>
            {modulo.subtitulo && <p className="text-xl text-gray-300 mb-6">{modulo.subtitulo}</p>}
            
            <div className="flex flex-col md:flex-row items-center gap-6 mt-8">
              <button 
                onClick={() => navigate(`/modulos/${id}/clase`)}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(255,87,34,0.3)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,87,34,0.5)] w-full md:w-auto justify-center"
              >
                <Play className="w-6 h-6 fill-current" />
                {porcentaje === 0 ? 'Iniciar Módulo' : 'Continuar Aprendizaje'}
              </button>

              <div className="flex items-center gap-4 w-full md:w-64">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-300">{porcentaje}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Temario (Syllabus) */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Temario del Módulo
          </h2>

          <div className="space-y-6">
            {(modulo.misiones || []).map((mision, idx) => (
              <div key={mision.id} className="bg-[#141617] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 bg-[#1A1C1E] border-b border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{mision.titulo}</h3>
                      <p className="text-sm text-gray-400 mt-1">{mision.objetivo || 'Misión'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-800/50">
                  {(mision.bloques || []).map((bloque) => {
                    const isCompletado = bloquesCompletados.includes(bloque.id);
                    return (
                      <div key={bloque.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                        <div className="flex items-center gap-4">
                          {isCompletado ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-600 shrink-0" />
                          )}
                          <span className={`text-sm ${isCompletado ? 'text-gray-300' : 'text-gray-500'}`}>{bloque.titulo}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">
                          {bloque.duracion_estimada_min} min
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {(!modulo.misiones || modulo.misiones.length === 0) && (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                Este módulo aún no tiene contenido publicado.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
