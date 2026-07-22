import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, XCircle, UserX, UserCheck } from 'lucide-react';
import ModuloForm from '../components/ModuloForm';

export default function AdminDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alumnos'); // 'alumnos' | 'certificaciones' | 'modulos'
  const [alumnos, setAlumnos] = useState([]);
  const [certificaciones, setCertificaciones] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalType, setModalType] = useState(null); // 'rechazo', 'bloqueo', 'moduloForm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [motivo, setMotivo] = useState('');

  const fetchAlumnos = async () => {
    try {
      const res = await fetch('/api/admin/alumnos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlumnos(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCertificaciones = async () => {
    try {
      const res = await fetch('/api/certificaciones/admin/candidatos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCertificaciones(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModulos = async () => {
    try {
      const res = await fetch('/api/admin/modulos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setModulos(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'alumnos') {
      fetchAlumnos().finally(() => setLoading(false));
    } else if (activeTab === 'certificaciones') {
      fetchCertificaciones().finally(() => setLoading(false));
    } else {
      fetchModulos().finally(() => setLoading(false));
    }
  }, [activeTab, token]);

  const handleEstadoAlumno = async (id, estado) => {
    try {
      const res = await fetch(`/api/admin/alumnos/${id}/estado`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        fetchAlumnos();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCertificacion = async (id, estado, motivoStr = '') => {
    try {
      const res = await fetch(`/api/certificaciones/admin/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado, motivo: motivoStr })
      });
      if (res.ok) {
        fetchCertificaciones();
        setModalType(null);
        setSelectedItem(null);
        setMotivo('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCrearModuloBorrador = async () => {
    try {
      const res = await fetch('/api/admin/modulos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const nuevoMod = await res.json();
        navigate(`/admin/modulos/${nuevoMod.id}/editar`);
      } else {
        const errorData = await res.json().catch(() => null);
        alert(`Error al crear módulo: ${errorData?.error || res.status}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error de red: ${e.message}`);
    }
  };

  const openRechazoModal = (cert) => {
    setSelectedItem(cert);
    setModalType('rechazo');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex items-center gap-4">
        <div className="p-4 bg-brand-accent/10 rounded-xl">
          <Shield className="w-10 h-10 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Panel de Administración</h1>
          <p className="text-gray-400">Gestiona alumnos, métricas y certificaciones de la comunidad.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('alumnos')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'alumnos' 
              ? 'border-brand-accent text-brand-accent' 
              : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
          }`}
        >
          Directorio de Alumnos
        </button>
        <button
          onClick={() => setActiveTab('certificaciones')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'certificaciones' 
              ? 'border-brand-accent text-brand-accent' 
              : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
          }`}
        >
          Certificaciones Pendientes
        </button>
        <button
          onClick={() => setActiveTab('modulos')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'modulos' 
              ? 'border-brand-accent text-brand-accent' 
              : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
          }`}
        >
          Gestor de Currículum
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 p-8 text-center">Cargando información...</div>
      ) : activeTab === 'alumnos' ? (
        <div className="grid gap-4">
          {alumnos.map(alumno => (
            <div key={alumno.id} className="bg-[#1e2124] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white">{alumno.nombre_completo}</h3>
                <p className="text-gray-400 text-sm mb-2">{alumno.email}</p>
                <div className="flex gap-4 text-sm mt-3">
                  <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                    {alumno.total_operaciones || 0} Ops
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                    WR: {alumno.win_rate ? Number(alumno.win_rate).toFixed(2) : 0}%
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                    R: {alumno.r_multiple_promedio ? Number(alumno.r_multiple_promedio).toFixed(2) : 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  alumno.estado === 'activo' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {alumno.estado.toUpperCase()}
                </span>
                
                {alumno.estado === 'activo' ? (
                  <button 
                    onClick={() => handleEstadoAlumno(alumno.id, 'inactivo')}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-alert/10 text-brand-alert hover:bg-brand-alert hover:text-white rounded-lg transition-colors text-sm"
                  >
                    <UserX className="w-4 h-4" /> Bloquear
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEstadoAlumno(alumno.id, 'activo')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-900/30 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    <UserCheck className="w-4 h-4" /> Desbloquear
                  </button>
                )}
              </div>
            </div>
          ))}
          {alumnos.length === 0 && <p className="text-gray-500">No hay alumnos registrados.</p>}
        </div>
      ) : activeTab === 'certificaciones' ? (
        <div className="grid gap-4">
          {certificaciones.map(cert => (
            <div key={cert.id} className="bg-[#1e2124] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start gap-4 hover:border-gray-700 transition-colors">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Solicitud de: {cert.nombre_completo}</h3>
                <p className="text-gray-400 text-sm mb-4">Email: {cert.email}</p>
                <div className="space-y-2 text-sm bg-brand-bg p-4 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Operaciones (Mín. {cert.criterios_cumplidos.operaciones.requerido}):</span>
                    <span className={cert.criterios_cumplidos.operaciones.cumple ? 'text-green-400' : 'text-brand-accent'}>
                      {cert.criterios_cumplidos.operaciones.valor}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Adherencia al plan (Mín. {cert.criterios_cumplidos.adherencia.requerido}%):</span>
                    <span className={cert.criterios_cumplidos.adherencia.cumple ? 'text-green-400' : 'text-brand-accent'}>
                      {Number(cert.criterios_cumplidos.adherencia.valor).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">R Múltiple Promedio (Mín. {cert.criterios_cumplidos.r_multiple.requerido}):</span>
                    <span className={cert.criterios_cumplidos.r_multiple.cumple ? 'text-green-400' : 'text-brand-accent'}>
                      {Number(cert.criterios_cumplidos.r_multiple.valor).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[140px]">
                <button 
                  onClick={() => handleCertificacion(cert.id, 'aprobado')}
                  className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" /> Aprobar
                </button>
                <button 
                  onClick={() => openRechazoModal(cert)}
                  className="flex justify-center items-center gap-2 px-4 py-2 border border-brand-accent text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors font-medium"
                >
                  <XCircle className="w-5 h-5" /> Rechazar
                </button>
              </div>
            </div>
          ))}
          {certificaciones.length === 0 && <p className="text-gray-500">No hay certificaciones pendientes de revisión.</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleCrearModuloBorrador}
              className="px-4 py-2 bg-brand-accent hover:bg-[#ff9075] text-white rounded-lg transition-colors font-medium"
            >
              + Nuevo Módulo
            </button>
          </div>
          {modulos.map(modulo => (
            <div key={modulo.id} className="bg-[#1e2124] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Módulo {modulo.numero_orden}: {modulo.titulo}
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">Nivel: {modulo.nivel}</span>
                  <span className="text-brand-accent capitalize">Formato: {modulo.formato_principal}</span>
                  <span className={`font-medium ${modulo.activo ? 'text-green-400' : 'text-red-400'}`}>
                    {modulo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(`/admin/modulos/${modulo.id}/editar`)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={async () => {
                    await fetch(`/api/admin/modulos/${modulo.id}/estado`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ activo: !modulo.activo })
                    });
                    fetchModulos();
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    modulo.activo 
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white' 
                      : 'bg-green-900/30 text-green-400 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  {modulo.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
          {modulos.length === 0 && <p className="text-gray-500">No hay módulos creados aún.</p>}
        </div>
      )}

      {modalType === 'rechazo' && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1e2124] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-heading font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="text-brand-accent w-6 h-6" /> Rechazar Certificación
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Por favor, provee un motivo detallado del rechazo. Este motivo quedará registrado y será visible para el alumno <b>{selectedItem.nombre_completo}</b>.
            </p>
            <textarea
              className="w-full bg-[#141617] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent mb-6"
              rows="4"
              placeholder="Ej. Tienes un win rate muy alto, pero tu adherencia al plan cayó en las últimas 5 operaciones..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setModalType(null); setSelectedItem(null); setMotivo(''); }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleCertificacion(selectedItem.id, 'rechazado', motivo)}
                disabled={!motivo.trim()}
                className="px-4 py-2 bg-brand-accent hover:bg-[#ff9075] text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modulo Form */}
      {modalType === 'moduloForm' && (
        <ModuloForm 
          modulo={selectedItem} 
          onClose={() => { setModalType(null); setSelectedItem(null); }} 
          onSaved={() => { setModalType(null); setSelectedItem(null); fetchModulos(); }} 
        />
      )}

    </div>
  );
}
