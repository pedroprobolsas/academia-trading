import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';

import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Curriculum from './pages/Curriculum';
import ModuloDetalle from './pages/ModuloDetalle';
import AdminDashboard from './pages/AdminDashboard';
import ConstructorModulos from './components/admin/ConstructorModulos/ConstructorModulos';
import Sidebar from './components/Sidebar';

// Componente protector de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <div className="min-h-screen bg-brand-bg flex">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

// Rutas de Admin
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/journal" 
        element={
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/modulos" 
        element={
          <ProtectedRoute>
            <Curriculum />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/modulos/:id" 
        element={
          <ProtectedRoute>
            <ModuloDetalle />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/modulos/:id/editar" 
        element={
          <AdminRoute>
            <ConstructorModulos />
          </AdminRoute>
        } 
      />
      <Route path="/configuracion" element={<ProtectedRoute><div className="p-8 text-white">Configuración</div></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
