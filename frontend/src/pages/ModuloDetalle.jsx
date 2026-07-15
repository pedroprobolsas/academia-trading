import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function ModuloDetalle() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [modulo, setModulo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch specific module details
        const resModulos = await fetch('/api/modulos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allModulos = await resModulos.json();
        const found = allModulos.find(m => m.id === id);
        
        if (!found) {
          navigate('/modulos');
          return;
        }
        
        if (found.estado === 'bloqueado') {
          alert('Este módulo está bloqueado.');
          navigate('/modulos');
          return;
        }

        setModulo(found);

        // Fetch questions for this module
        const resPreguntas = await fetch(`/api/modulos/${id}/preguntas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataPreguntas = await resPreguntas.json();
        setPreguntas(dataPreguntas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token, navigate]);

  const handleOptionChange = (preguntaId, valor) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const handlePracticaChange = (preguntaId, valor) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: parseFloat(valor) }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setQuizResult(null);

    // Format respuestas to expected array
    const formattedRespuestas = Object.keys(respuestas).map(qId => ({
      pregunta_id: qId,
      respuesta_dada: respuestas[qId]
    }));

    try {
      const res = await fetch(`/api/modulos/${id}/quiz-intentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: 'checkpoint_modulo',
          respuestas: formattedRespuestas
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al calificar');
      
      setQuizResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !modulo) {
    return <div className="p-8 text-gray-400">Cargando clase...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/modulos" className="inline-flex items-center gap-2 text-brand-accent hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Volver al Currículum
      </Link>

      <header className="mb-8">
        <div className="text-sm font-bold text-gray-400 mb-2 font-heading tracking-wider uppercase">
          Módulo {modulo.numero_orden}
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">{modulo.titulo}</h1>
        <p className="text-lg text-gray-300">{modulo.descripcion}</p>
      </header>

      {/* Visor de Contenido (Placeholder para Video/Notion) */}
      <div className="bg-black aspect-video rounded-2xl border border-gray-800 flex flex-col items-center justify-center mb-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand-accent/5 group-hover:bg-brand-accent/10 transition-colors"></div>
        {modulo.contenido_tipo === 'video' ? (
          <PlayCircle className="w-20 h-20 text-brand-accent mb-4 opacity-80 group-hover:scale-110 transition-transform" />
        ) : (
          <FileText className="w-20 h-20 text-brand-accent mb-4 opacity-80 group-hover:scale-110 transition-transform" />
        )}
        <h3 className="text-xl font-bold text-white relative z-10">Material de la Clase</h3>
        <a href={modulo.contenido_url} target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-brand-accent text-white font-bold rounded-lg relative z-10 hover:bg-white hover:text-brand-accent transition-colors">
          Abrir en {modulo.contenido_tipo === 'video' ? 'YouTube' : 'Notion'}
        </a>
      </div>

      {/* Sección del Quiz */}
      {preguntas.length > 0 && (
        <div className="bg-[#1e2124] rounded-2xl border border-gray-800 p-8 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-white mb-6 border-b border-gray-800 pb-4">
            Checkpoint: Demuestra lo aprendido
          </h2>

          {quizResult ? (
            <div className={`p-6 rounded-xl border ${quizResult.aprobado ? 'bg-green-500/10 border-green-500/30' : 'bg-brand-alert/10 border-brand-alert/30'} text-center`}>
              {quizResult.aprobado ? (
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-brand-alert mx-auto mb-4" />
              )}
              <h3 className={`text-2xl font-bold mb-2 ${quizResult.aprobado ? 'text-green-400' : 'text-brand-alert'}`}>
                Calificación: {quizResult.puntaje}%
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                {quizResult.aprobado 
                  ? '¡Excelente! Has aprobado el checkpoint y el siguiente módulo ha sido desbloqueado.' 
                  : 'No has alcanzado el 70% necesario. Repasa la clase e inténtalo de nuevo.'}
              </p>
              
              {!quizResult.aprobado ? (
                <button 
                  onClick={() => { setQuizResult(null); setRespuestas({}); }}
                  className="bg-brand-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                >
                  Reintentar Quiz
                </button>
              ) : (
                <Link 
                  to="/modulos"
                  className="inline-block bg-white text-brand-accent px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all"
                >
                  Continuar Aprendizaje
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitQuiz} className="space-y-8">
              {preguntas.map((q, idx) => (
                <div key={q.id} className="bg-[#141617] p-6 rounded-xl border border-gray-700">
                  <p className="text-lg font-medium text-white mb-4">
                    <span className="text-brand-accent font-bold mr-2">{idx + 1}.</span>
                    {q.enunciado}
                  </p>
                  
                  {q.tipo === 'opcion_multiple' || q.tipo === 'verdadero_falso' ? (
                    <div className="space-y-3">
                      {q.opciones.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors bg-[#1e2124]">
                          <input 
                            type="radio" 
                            name={`q_${q.id}`} 
                            className="w-4 h-4 accent-brand-accent"
                            required
                            checked={respuestas[q.id] === opt.id}
                            onChange={() => handleOptionChange(q.id, opt.id)}
                          />
                          <span className="text-gray-300">{opt.texto}</span>
                        </label>
                      ))}
                    </div>
                  ) : q.tipo === 'practica_numerica' ? (
                    <div>
                      <input 
                        type="number" 
                        step="0.01" 
                        required
                        placeholder="Escribe el valor exacto..."
                        className="w-full md:w-1/2 px-4 py-3 bg-[#1e2124] border border-gray-700 rounded-lg focus:outline-none focus:border-brand-accent text-white"
                        onChange={(e) => handlePracticaChange(q.id, e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              ))}

              <button 
                type="submit" 
                disabled={submitting || preguntas.length === 0}
                className="w-full py-4 bg-brand-accent text-white text-lg font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-[0_0_20px_rgba(253,123,91,0.2)]"
              >
                {submitting ? 'Calificando...' : 'Enviar Respuestas y Calificar'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
