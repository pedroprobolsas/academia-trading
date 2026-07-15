import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [consistencia, setConsistencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('http://localhost:3001/metricas/mi-dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error cargando dashboard');
        
        setMetricas(data.metricas_globales);
        setConsistencia(data.consistencia_semanal);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-gray-400">Cargando métricas...</div>;
  }

  if (error) {
    return <div className="p-8 text-brand-alert">Error: {error}</div>;
  }

  // Tarjetas de Métricas Principales
  const stats = [
    { 
      label: 'Operaciones', 
      value: metricas?.total_operaciones || 0, 
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    { 
      label: 'Win Rate', 
      value: `${Number(metricas?.win_rate || 0).toFixed(1)}%`, 
      icon: Target,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    { 
      label: 'R Promedio', 
      value: `${Number(metricas?.r_multiple_promedio || 0).toFixed(2)}R`, 
      icon: Number(metricas?.r_multiple_promedio || 0) >= 0 ? TrendingUp : TrendingDown,
      color: Number(metricas?.r_multiple_promedio || 0) >= 0 ? 'text-green-400' : 'text-brand-alert',
      bg: Number(metricas?.r_multiple_promedio || 0) >= 0 ? 'bg-green-400/10' : 'bg-brand-alert/10'
    },
    { 
      label: 'Adherencia al Plan', 
      value: `${Number(metricas?.pct_adherencia_plan || 0).toFixed(1)}%`, 
      icon: AlertTriangle,
      color: 'text-brand-accent',
      bg: 'bg-brand-accent/10'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          Hola, <span className="text-brand-accent">{user?.nombre_completo || 'Trader'}</span>
        </h1>
        <p className="text-gray-400">Este es el resumen de tu desempeño hasta la fecha.</p>
      </header>

      {/* Grid de KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-[#1e2124] p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                <p className="text-2xl font-heading font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Racha Semanal */}
      <div>
        <h2 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-2">
          <TrendingDown className="text-brand-alert w-6 h-6" />
          Racha Máxima de Pérdidas (Semanales)
        </h2>
        
        {consistencia.length === 0 ? (
          <div className="bg-[#1e2124] p-8 rounded-2xl border border-gray-800 text-center text-gray-400">
            Aún no hay datos de consistencia semanal. Registra operaciones para ver tu evolución.
          </div>
        ) : (
          <div className="bg-[#1e2124] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="p-4 text-sm font-medium text-gray-300">Semana (Inicio)</th>
                  <th className="p-4 text-sm font-medium text-gray-300 text-center">Racha Máxima Acumulada</th>
                  <th className="p-4 text-sm font-medium text-gray-300">Estado</th>
                </tr>
              </thead>
              <tbody>
                {consistencia.map((sem, idx) => {
                  const racha = Number(sem.racha_perdidas_maxima);
                  const limite = 3; // Límite arbitrario para MVP visual (el backend dictamina el bloqueo)
                  const enPeligro = racha >= limite;
                  
                  return (
                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="p-4 text-gray-300 font-medium">
                        {new Date(sem.semana_inicio).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${enPeligro ? 'bg-brand-alert text-white' : 'bg-gray-700 text-gray-300'}`}>
                          {racha}
                        </span>
                      </td>
                      <td className="p-4">
                        {enPeligro ? (
                          <span className="text-brand-alert text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Peligro de bloqueo
                          </span>
                        ) : (
                          <span className="text-green-400 text-sm font-medium">Bajo control</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
