import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Upload, X } from 'lucide-react';

export default function CreateOperationForm({ plan, onOperationCreated, onCancel }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha_operacion: new Date().toISOString().slice(0, 16),
    instrumento: plan?.instrumentos_permitidos?.[0] || '',
    direccion: 'compra',
    setup_usado: 'bmsb',
    riesgo_porcentaje: '',
    precio_entrada: '',
    precio_salida: '',
    resultado_r_multiple: '',
    resultado_moneda: '',
    respeto_entrada: false,
    respeto_stop: false,
    respeto_take_profit: false,
    origen_senal: 'senal_plan',
    movio_stop: false,
    sobreoperacion: false,
    emocion_previa: '',
    emocion_durante: '',
    emocion_posterior: '',
    notas: ''
  });

  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Crear Operación
      const payload = {
        ...formData,
        riesgo_porcentaje: parseFloat(formData.riesgo_porcentaje),
        precio_entrada: parseFloat(formData.precio_entrada),
        precio_salida: parseFloat(formData.precio_salida),
        resultado_r_multiple: parseFloat(formData.resultado_r_multiple),
        resultado_moneda: parseFloat(formData.resultado_moneda)
      };

      const resOp = await fetch('/api/operaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const dataOp = await resOp.json();
      if (!resOp.ok) throw new Error(dataOp.error || 'Error creando operación');

      const operacionId = dataOp.operacion_id;

      // 2. Subir Imagen si hay una seleccionada
      if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append('imagen', imageFile);

        const resImg = await fetch(`/api/operaciones/${operacionId}/captura`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataImg
        });
        const dataImg = await resImg.json();
        if (!resImg.ok) throw new Error(dataImg.error || 'Error subiendo captura');
      }

      onOperationCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e2124] p-6 rounded-2xl border border-gray-800 relative">
      <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="text-brand-accent w-6 h-6" />
        <h2 className="text-xl font-heading font-bold text-white">Registrar Operación</h2>
      </div>

      {error && <div className="mb-4 p-3 bg-brand-alert/10 border border-brand-alert rounded-lg text-brand-alert text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Fecha y Hora</label>
            <input type="datetime-local" required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.fecha_operacion} onChange={e => setFormData({...formData, fecha_operacion: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Instrumento</label>
            <select required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.instrumento} onChange={e => setFormData({...formData, instrumento: e.target.value})}>
              <option value="" disabled>Selecciona...</option>
              {plan?.instrumentos_permitidos?.map((inst, idx) => (
                <option key={idx} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Setup</label>
            <select required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.setup_usado} onChange={e => setFormData({...formData, setup_usado: e.target.value})}>
              <option value="soporte_resistencia">Soporte y Resistencia</option>
              <option value="accion_precio">Acción del Precio</option>
              <option value="medias_moviles">Medias Móviles</option>
              <option value="bmsb">BMSB</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Dirección</label>
            <select required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})}>
              <option value="compra">Compra (Long)</option>
              <option value="venta">Venta (Short)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Riesgo (%)</label>
            <input type="number" step="0.1" required placeholder="1.0" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.riesgo_porcentaje} onChange={e => setFormData({...formData, riesgo_porcentaje: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Resultado en R</label>
            <input type="number" step="0.01" required placeholder="Ej: 2.5 o -1.0" className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.resultado_r_multiple} onChange={e => setFormData({...formData, resultado_r_multiple: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Precio Entrada</label>
            <input type="number" step="0.00001" required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.precio_entrada} onChange={e => setFormData({...formData, precio_entrada: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Precio Salida</label>
            <input type="number" step="0.00001" required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.precio_salida} onChange={e => setFormData({...formData, precio_salida: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Ganancia/Pérdida ($)</label>
            <input type="number" step="0.01" required className="w-full bg-[#141617] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" value={formData.resultado_moneda} onChange={e => setFormData({...formData, resultado_moneda: e.target.value})} />
          </div>
        </div>

        {/* Checklists Disciplina */}
        <div className="bg-[#141617] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-2">Comportamiento (Checklist)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-accent" checked={formData.respeto_entrada} onChange={e => setFormData({...formData, respeto_entrada: e.target.checked})} />
              <span className="text-sm text-gray-400">Respeté Entrada</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-accent" checked={formData.respeto_stop} onChange={e => setFormData({...formData, respeto_stop: e.target.checked})} />
              <span className="text-sm text-gray-400">Respeté Stop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-accent" checked={formData.respeto_take_profit} onChange={e => setFormData({...formData, respeto_take_profit: e.target.checked})} />
              <span className="text-sm text-gray-400">Respeté TP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-alert" checked={formData.movio_stop} onChange={e => setFormData({...formData, movio_stop: e.target.checked})} />
              <span className="text-sm text-gray-400">¿Moví Stop Loss?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-alert" checked={formData.sobreoperacion} onChange={e => setFormData({...formData, sobreoperacion: e.target.checked})} />
              <span className="text-sm text-gray-400">¿Sobreoperación?</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Origen:</label>
              <select className="bg-[#1e2124] border border-gray-700 rounded text-xs text-white p-1" value={formData.origen_senal} onChange={e => setFormData({...formData, origen_senal: e.target.value})}>
                <option value="senal_plan">Mi Plan</option>
                <option value="impulso">Impulso</option>
                <option value="externo">Alguien más</option>
              </select>
            </div>
          </div>
        </div>

        {/* Captura de MinIO */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Captura Gráfica (Opcional pero Recomendado)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-brand-accent transition-colors bg-[#141617]">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">
                  {imageFile ? <span className="text-brand-accent font-bold">{imageFile.name}</span> : <span>Haz clic para subir imagen (PNG/JPG)</span>}
                </p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-opacity-90 transition-all">
          {loading ? 'Guardando...' : 'Registrar Operación en el Journal'}
        </button>
      </form>
    </div>
  );
}
