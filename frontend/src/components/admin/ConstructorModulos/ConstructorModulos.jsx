import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Check, AlertCircle, ArrowLeft, Loader2, Eye } from 'lucide-react';

import TabGeneral from './Tabs/TabGeneral';
import TabTransformacion from './Tabs/TabTransformacion';
import TabInvestigacion from './Tabs/TabInvestigacion';
import TabMisiones from './Tabs/TabMisiones';
import TabPractica from './Tabs/TabPractica';
import TabEvaluacion from './Tabs/TabEvaluacion';
import TabRetencion from './Tabs/TabRetencion';
import TabAnalitica from './Tabs/TabAnalitica';
import TabPublicacion from './Tabs/TabPublicacion';

const TABS = [
  { id: 'general', label: 'General', component: TabGeneral },
  { id: 'transformacion', label: 'Transformación', component: TabTransformacion },
  { id: 'investigacion', label: 'Investigación e IA', component: TabInvestigacion },
  { id: 'misiones', label: 'Misiones y Contenidos', component: TabMisiones },
  { id: 'practica', label: 'Práctica', component: TabPractica },
  { id: 'evaluacion', label: 'Evaluación', component: TabEvaluacion },
  { id: 'retencion', label: 'Retención', component: TabRetencion },
  { id: 'analitica', label: 'Analítica', component: TabAnalitica },
  { id: 'publicacion', label: 'Publicación', component: TabPublicacion },
];

export default function ConstructorModulos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [modulo, setModulo] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [loading, setLoading] = useState(true);
  
  // Guardamos la referencia para el debounce timeout
  const timeoutRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchModulo = async () => {
      try {
        const res = await fetch(`/api/admin/modulos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('No se pudo cargar el módulo');
        const data = await res.json();
        // Asegurar que metadata exista
        if (!data.metadata) data.metadata = {};
        setModulo(data);
      } catch (e) {
        console.error(e);
        // Fallback local?
        const local = localStorage.getItem(`draft_mod_${id}`);
        if (local) {
           setModulo(JSON.parse(local));
        } else {
           navigate('/admin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchModulo();
  }, [id, token, navigate]);

  // Hook para guardar cambios parciales (Debounce Optimista)
  const saveChanges = useCallback(async (updates) => {
    setSaveStatus('saving');
    try {
      // 1. Guardado local de contingencia
      const modCopy = { ...modulo, ...updates };
      localStorage.setItem(`draft_mod_${id}`, JSON.stringify(modCopy));

      // 2. PATCH al backend
      const res = await fetch(`/api/admin/modulos/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
           ...updates,
           updated_at: modulo.updated_at // Control de concurrencia optimista
        })
      });

      if (!res.ok) {
        if (res.status === 409) {
          alert('Conflicto: Este módulo fue modificado en otra pestaña o sesión. Por favor, recarga.');
        }
        throw new Error('Error al guardar en el servidor');
      }

      const updatedModulo = await res.json();
      
      // Limpiar localstorage al asegurar guardado
      localStorage.removeItem(`draft_mod_${id}`);
      
      // Actualizamos el updated_at para el próximo guardado
      setModulo(prev => ({ ...prev, updated_at: updatedModulo.updated_at }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  }, [id, token, modulo]);

  // Función manejadora que envuelve updates con debounce
  const updateModuloData = (updates) => {
    // Actualización optimista de la UI
    setModulo(prev => {
        const next = { ...prev, ...updates };
        if (updates.metadata) {
            next.metadata = { ...prev.metadata, ...updates.metadata };
        }
        return next;
    });
    setSaveStatus('saving');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveChanges(updates);
    }, 2500);
  };

  if (loading) return <div className="p-8 text-white flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!modulo) return null;

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || TabGeneral;

  return (
    <div className="flex flex-col h-screen bg-[#141617] text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-[#1e2124] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-heading truncate max-w-md">
              {modulo.titulo || 'Módulo sin título'}
            </h1>
            <div className="flex gap-2 text-xs font-medium mt-1">
              <span className={`px-2 py-0.5 rounded-full ${modulo.estado === 'borrador' ? 'bg-yellow-900/40 text-yellow-500' : 'bg-green-900/40 text-green-500'}`}>
                {modulo.estado.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                v{modulo.version}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && <span className="text-gray-400 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span>}
            {saveStatus === 'saved' && <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" /> Guardado</span>}
            {saveStatus === 'error' && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Error al guardar</span>}
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg text-sm transition-colors">
            <Eye className="w-4 h-4" /> Vista Previa
          </button>
        </div>
      </header>

      {/* Main Content - Two panes: Sidebar Tabs & Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tab Sidebar */}
        <div className="w-64 bg-[#1a1d1f] border-r border-gray-800 flex flex-col overflow-y-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 text-left transition-colors font-medium text-sm border-l-4 ${
                activeTab === tab.id 
                  ? 'border-brand-accent bg-brand-accent/10 text-white' 
                  : 'border-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#141617] p-8">
          <ActiveComponent modulo={modulo} updateModuloData={updateModuloData} />
        </div>
      </div>
    </div>
  );
}
