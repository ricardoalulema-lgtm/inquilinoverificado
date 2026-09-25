import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardInquilino from './pages/DashboardInquilino';
import DashboardArrendador from './pages/DashboardArrendador';
import DashboardAdmin from './pages/DashboardAdmin';
import Search from './pages/Search';
import Calificar from './pages/Calificar';
import MisCalificaciones from './pages/MisCalificaciones';
import MisPagos from './pages/MisPagos';
import MisContratos from './pages/MisContratos';
import ResenasInquilino from './pages/ResenasInquilino';
import CalificarDirecto from './pages/CalificarDirecto';
import ReclamarInvitacion from './pages/ReclamarInvitacion';
import GestionInquilinos from './pages/GestionInquilinos';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function DashboardRedirect() {
  const { userData } = useAuth();
  if (!userData) return <Navigate to="/login" />;
  if (userData.rol === 'inquilino') return <Navigate to="/dashboard/inquilino" />;
  if (userData.rol === 'arrendador') return <Navigate to="/dashboard/arrendador" />;
  if (userData.rol === 'admin') return <Navigate to="/dashboard/admin" />;
  return <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1 has-bottom-nav">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/r/:token" element={<Calificar />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
              <Route path="/dashboard/inquilino" element={<ProtectedRoute requiredRole="inquilino"><DashboardInquilino /></ProtectedRoute>} />
              <Route path="/dashboard/arrendador" element={<ProtectedRoute requiredRole="arrendador"><DashboardArrendador /></ProtectedRoute>} />
              <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardAdmin /></ProtectedRoute>} />
              <Route path="/buscar" element={<ProtectedRoute requiredRole="arrendador"><Search /></ProtectedRoute>} />
                <Route path="/mis-calificaciones" element={<ProtectedRoute requiredRole="inquilino"><MisCalificaciones /></ProtectedRoute>} />
                <Route path="/mis-pagos" element={<ProtectedRoute requiredRole="inquilino"><MisPagos /></ProtectedRoute>} />
                <Route path="/mis-contratos" element={<ProtectedRoute requiredRole="inquilino"><MisContratos /></ProtectedRoute>} />
              <Route path="/resenas/:cedula" element={<ProtectedRoute requiredRole="arrendador"><ResenasInquilino /></ProtectedRoute>} />
              <Route path="/calificar/:cedula" element={<ProtectedRoute requiredRole="arrendador"><CalificarDirecto /></ProtectedRoute>} />
              <Route path="/gestion-inquilinos" element={<ProtectedRoute requiredRole="arrendador"><GestionInquilinos /></ProtectedRoute>} />
              <Route path="/i/:token" element={<ReclamarInvitacion />} />
              <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
