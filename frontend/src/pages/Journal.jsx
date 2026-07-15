import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, List, Image as ImageIcon } from 'lucide-react';
import CreatePlanForm from '../components/CreatePlanForm';
import CreateOperationForm from '../components/CreateOperationForm';

export default function Journal() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsPlan, setNeedsPlan] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [showCreateOp, setShowCreateOp] = useState(false);
  const [operaciones, setOperaciones] = useState([]);
  
  // Modals for images
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Check if plan exists
      const resPlan = await fetch('http://localhost:3001/planes-trading/activo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resPlan.status === 404) {
        setNeedsPlan(true);
        setLoading(false);
        return;
      }
      if (!resPlan.ok) throw new Error('Error verificando plan');
      
      const planData = await resPlan.json();
      setActivePlan(planData);
      setNeedsPlan(false);

      // 2. Fetch operations
      const resOps = await fetch('http://localhost:3001/operaciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataOps = await resOps.json();
      setOperaciones(dataOps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const viewImage = async (opId) => {
    try {
      const res = await fetch(`http://localhost:3001/operaciones/${opId}/captura-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedImage(data.presigned_url);
      } else {
        alert('No se pudo cargar la imagen: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de red al cargar la imagen');
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-400">Cargando Journal...</div>;
  }

  // Pre-condición: Si no tiene plan, mostrar el form
  if (needsPlan) {
    return (
      <div className="p-8">
        <CreatePlanForm onPlanCreated={() => {
          setNeedsPlan(false);
          fetchData();
        }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Journal de Operaciones</h1>
          <p className="text-gray-400">Registra y revisa tu historial para mejorar.</p>
        </div>
        <button 
          onClick={() => setShowCreateOp(true)}
          className="bg-brand-accent text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> Nueva Operación
        </button>
      </header>

      {showCreateOp && (
        <div className="mb-8">
          <CreateOperationForm 
            plan={activePlan}
            onCancel={() => setShowCreateOp(false)}
            onOperationCreated={() => {
              setShowCreateOp(false);
              fetchData();
            }} 
          />
        </div>
      )}

      {/* Listado de Operaciones */}
      <div>
        <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
          <List className="text-gray-400 w-6 h-6" /> Historial Reciente
        </h2>

        {operaciones.length === 0 ? (
          <div className="bg-[#1e2124] p-8 rounded-2xl border border-gray-800 text-center text-gray-400">
            Aún no has registrado ninguna operación. ¡Es hora de hacer trading!
          </div>
        ) : (
          <div className="bg-[#1e2124] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="p-4 text-sm font-medium text-gray-300">Fecha</th>
                  <th className="p-4 text-sm font-medium text-gray-300">Activo</th>
                  <th className="p-4 text-sm font-medium text-gray-300">R Múltiple</th>
                  <th className="p-4 text-sm font-medium text-gray-300">Respetó Plan</th>
                  <th className="p-4 text-sm font-medium text-gray-300 text-center">Evidencia</th>
                </tr>
              </thead>
              <tbody>
                {operaciones.map((op) => (
                  <tr key={op.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="p-4 text-gray-300 font-medium">{new Date(op.fecha_operacion).toLocaleString()}</td>
                    <td className="p-4">
                      <span className="text-white font-bold">{op.instrumento}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${op.direccion === 'compra' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-brand-alert'}`}>
                        {op.direccion.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${Number(op.resultado_r_multiple) >= 0 ? 'text-green-400' : 'text-brand-alert'}`}>
                        {Number(op.resultado_r_multiple) >= 0 ? '+' : ''}{op.resultado_r_multiple}R
                      </span>
                    </td>
                    <td className="p-4">
                      {op.respeto_plan ? (
                        <span className="text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">Sí</span>
                      ) : (
                        <span className="text-brand-alert text-sm font-medium bg-brand-alert/10 px-2 py-1 rounded">No</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {op.captura_object_name ? (
                        <button onClick={() => viewImage(op.id)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Ver Captura">
                          <ImageIcon className="w-5 h-5 mx-auto" />
                        </button>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para ver imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-brand-accent">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Evidencia" className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
