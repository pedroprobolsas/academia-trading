import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function Registro() {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      // Redirigir al login para que inicie sesión
      navigate('/login', { state: { mensaje: 'Registro exitoso. Ahora puedes iniciar sesión.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-8">
      <div className="w-full max-w-md bg-[#1e2124] p-8 rounded-2xl shadow-[0_0_40px_rgba(253,123,91,0.05)] border border-gray-800 backdrop-blur-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            Crear <span className="text-brand-accent">Cuenta</span>
          </h1>
          <p className="text-gray-400 text-sm">Únete a la Academia de Trading</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-alert/10 border border-brand-alert/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-brand-alert w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-brand-alert text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre_completo"
              required
              value={formData.nombre_completo}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#141617] border border-gray-700 rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-white transition-all placeholder-gray-600"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#141617] border border-gray-700 rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-white transition-all placeholder-gray-600"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#141617] border border-gray-700 rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-white transition-all placeholder-gray-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-accent hover:bg-[#ff8f73] text-[#141617] font-bold rounded-lg transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registrando...' : (
              <>
                <UserPlus className="w-5 h-5" />
                Registrarse
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-accent hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
