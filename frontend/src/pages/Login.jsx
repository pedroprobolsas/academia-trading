import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.token, data.user);
      navigate('/dashboard'); // Redirigiremos al dashboard (Bloque 3)
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md bg-[#1e2124] p-8 rounded-2xl shadow-[0_0_40px_rgba(253,123,91,0.05)] border border-gray-800 backdrop-blur-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            Academia de <span className="text-brand-accent">Trading</span>
          </h1>
          <p className="text-gray-400 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-alert/10 border border-brand-alert/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-brand-alert w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-brand-alert text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#141617] border border-gray-700 rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-white transition-all placeholder-gray-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-accent hover:bg-[#ff8f73] text-[#141617] font-bold rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Conectando...' : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="text-brand-accent hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
