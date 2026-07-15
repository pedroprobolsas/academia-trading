import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Currículum', path: '/modulos', icon: BookOpen },
    { name: 'Journal', path: '/journal', icon: BookOpen },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1e2124] border-r border-gray-800 min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-heading font-bold text-white leading-tight">
          Academia <br />
          <span className="text-brand-accent">Trading</span>
        </h2>
      </div>

      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-accent' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="px-4 py-2 mb-4">
          <p className="text-sm font-medium text-gray-300 truncate">
            {user?.nombre_completo || 'Alumno'}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-brand-alert hover:bg-brand-alert/10 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
