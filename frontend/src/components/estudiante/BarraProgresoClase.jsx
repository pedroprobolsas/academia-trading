import React, { useState, useEffect } from 'react';

export default function BarraProgresoClase({ bloqueActivo, progreso, onCompletado }) {
  const [canComplete, setCanComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadyCompleted = progreso?.bloques_completados?.some(b => b.bloque_id === bloqueActivo?.id);

  // Lógica de "Consumo Real"
  useEffect(() => {
    if (!bloqueActivo) return;
    if (isAlreadyCompleted) {
      setCanComplete(true);
      return;
    }

    setCanComplete(false);

    if (bloqueActivo.tipo === 'texto_markdown' || bloqueActivo.tipo === 'documento_drive' || bloqueActivo.tipo === 'imagen') {
      // 30 segundos obligatorios
      setTimeLeft(30);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } 
    else if (bloqueActivo.tipo === 'video_youtube' || bloqueActivo.tipo === 'audio') {
      // Por ahora simulamos 80% del video con un timer estricto rápido (10s) para prueba, 
      // idealmente esto se conecta a la API de YouTube OnStateChange en producción.
      // Implementaremos la conexión profunda después.
      setTimeLeft(10); 
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    else {
      setCanComplete(true);
    }
  }, [bloqueActivo, isAlreadyCompleted]);

  const handleCompletar = async () => {
    if (!canComplete || isAlreadyCompleted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/modulos/bloques/${bloqueActivo.id}/completar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Enviamos métricas mockeadas por ahora
        body: JSON.stringify({
          tiempo_consumido_segundos: 30,
          porcentaje_visto: 100
        })
      });

      if (response.ok) {
        onCompletado(); // Notifica al padre para refrescar y avanzar
      } else {
        alert("Error al marcar como completado.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#141617]/90 backdrop-blur-md border-t border-gray-800 px-8 flex items-center justify-between">
      <div className="text-sm text-gray-400">
        {!isAlreadyCompleted && !canComplete && timeLeft > 0 && (
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            Consumiendo contenido... ({timeLeft}s)
          </span>
        )}
        {isAlreadyCompleted && (
           <span className="text-green-500 flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             Completado
           </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Aquí podríamos agregar botón de Anterior, por ahora solo Siguiente/Completar */}
        <button
          onClick={handleCompletar}
          disabled={!canComplete && !isAlreadyCompleted}
          className={`
            px-8 py-3 rounded-xl font-semibold transition-all duration-300
            ${isAlreadyCompleted 
              ? 'bg-gray-800 text-gray-400 opacity-50 cursor-not-allowed hidden' // Ocultamos el botón si ya completó, o mostrar "Siguiente" genérico
              : canComplete
                ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-[0_0_20px_rgba(255,87,34,0.3)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? 'Guardando...' : isAlreadyCompleted ? 'Completado' : 'Marcar y Continuar'}
        </button>
      </div>
    </div>
  );
}
