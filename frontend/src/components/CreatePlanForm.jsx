import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Save } from 'lucide-react';

export default function CreatePlanForm({ onPlanCreated }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    instrumentos_permitidos: '',
    riesgo_maximo_operacion: '',
    setups_autorizados: [],
    regla_stop_diario: '',
    condiciones_no_operar: ''
  });

  const availableSetups = [
    { id: 'soporte_resistencia', label: 'Soporte y Resistencia' },
    { id: 'accion_precio', label: 'Acción del Precio' },
    { id: 'medias_moviles', label: 'Medias Móviles' },
    { id: 'bmsb', label: 'BMSB' },
    { id: 'otro', label: 'Otro' }
  ];

  const handleSetupChange = (setupId) => {
    setFormData(prev => {
      const isSelected = prev.setups_autorizados.includes(setupId);
      if (isSelected) {
        return { ...prev, setups_autorizados: prev.setups_autorizados.filter(id => id !== setupId) };
      } else {
        return { ...prev, setups_autorizados: [...prev.setups_autorizados, setupId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.setups_autorizados.length === 0) {
      setError('Debes seleccionar al menos un setup autorizado.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Parse arrays
      const payload = {
        instrumentos_permitidos: formData.instrumentos_permitidos.split(',').map(s => s.trim()).filter(Boolean),
        riesgo_maximo_operacion: parseFloat(formData.riesgo_maximo_operacion),
        setups_autorizados: formData.setups_autorizados,
        regla_stop_diario: parseFloat(formData.regla_stop_diario),
        condiciones_no_operar: formData.condiciones_no_operar
      };

      const res = await fetch('/api/planes-trading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando plan');
      onPlanCreated(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#1e2124] p-8 rounded-2xl border border-brand-accent/20 shadow-[0_0_15px_rgba(253,123,91,0.1)]">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-brand-accent/10 rounded-full">
          <FileText className="text-brand-accent w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-white">Crea tu Plan de Trading</h2>
          <p className="text-gray-400 text-sm">Es obligatorio definir tus reglas antes de operar.</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-brand-alert/10 border border-brand-alert rounded-lg text-brand-alert">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Instrumentos Permitidos (separados por coma)</label>
          <input type="text" required placeholder="Ej: Vol75, Vol100, Step Index" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" value={formData.instrumentos_permitidos} onChange={e => setFormData({...formData, instrumentos_permitidos: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Setups Autorizados (Elige al menos uno)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSetups.map(setup => (
              <label key={setup.id} className="flex items-center gap-2 cursor-pointer bg-[#141617] border border-gray-700 p-2 rounded-lg hover:border-brand-accent transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-brand-accent"
                  checked={formData.setups_autorizados.includes(setup.id)}
                  onChange={() => handleSetupChange(setup.id)}
                />
                <span className="text-sm text-gray-300">{setup.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Riesgo Máximo por Operación (%)</label>
            <input type="number" step="0.1" required placeholder="1.0" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" value={formData.riesgo_maximo_operacion} onChange={e => setFormData({...formData, riesgo_maximo_operacion: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Regla Stop Diario (%)</label>
            <input type="number" step="0.1" required placeholder="3.0" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" value={formData.regla_stop_diario} onChange={e => setFormData({...formData, regla_stop_diario: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Condiciones para No Operar (Opcional)</label>
          <textarea placeholder="Ej: No operar si estoy cansado o es viernes por la tarde" rows="2" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" value={formData.condiciones_no_operar} onChange={e => setFormData({...formData, condiciones_no_operar: e.target.value})}></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {loading ? 'Guardando...' : 'Activar Plan de Trading'}
        </button>
      </form>
    </div>
  );
}
