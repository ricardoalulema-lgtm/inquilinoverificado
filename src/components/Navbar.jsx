import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { FaSearch, FaUser, FaHome, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaShieldAlt, FaStar, FaTachometerAlt, FaUsers } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';

const Navbar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <header className="app-header d-md-up">
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <FaShieldAlt size={20} />
          <strong>GoodRenter</strong>
        </Link>
      </header>

      <nav className="bottom-nav d-md-down">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <FaHome />
          <span>Home</span>
        </Link>
        {currentUser && userData?.rol === 'arrendador' && (
          <Link to="/buscar" className={isActive('/buscar') ? 'active' : ''}>
            <FaSearch />
            <span>Buscar</span>
          </Link>
        )}
        {currentUser && userData?.rol === 'arrendador' && (
          <Link to="/gestion-inquilinos" className={isActive('/gestion-inquilinos') ? 'active' : ''}>
            <FaUsers />
            <span>Inquilinos</span>
          </Link>
        )}
        {currentUser && userData?.rol === 'inquilino' && (
          <Link to="/mis-calificaciones" className={isActive('/mis-calificaciones') ? 'active' : ''}>
            <FaStar />
            <span>Mis Reviews</span>
          </Link>
        )}
        <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
          <FaTachometerAlt />
          <span>{currentUser ? 'Dashboard' : 'Ingresar'}</span>
        </Link>
        {currentUser && (
          <Link to="/perfil" className={location.pathname === '/perfil' ? 'active' : ''}>
            <FaUser />
            <span>Cuenta</span>
          </Link>
        )}
        {currentUser ? (
          <button onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Salir</span>
          </button>
        ) : (
          <Link to="/register">
            <FaUserPlus />
            <span>Unirse</span>
          </Link>
        )}
      </nav>

      <BSNavbar expand="lg" bg="dark" variant="dark" sticky="top" className="d-md-down-none">
        <Container>
          <BSNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <FaShieldAlt /> GoodRenter
          </BSNavbar.Brand>
          <BSNavbar.Toggle aria-controls="main-navbar" />
          <BSNavbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              {currentUser && (
                <>
                  {userData?.rol === 'arrendador' && (
                    <Nav.Link as={NavLink} to="/buscar">Buscar</Nav.Link>
                  )}
                  {userData?.rol === 'arrendador' && (
                    <Nav.Link as={NavLink} to="/gestion-inquilinos">Inquilinos</Nav.Link>
                  )}
                  {userData?.rol === 'inquilino' && (
                    <Nav.Link as={NavLink} to="/mis-calificaciones">Mis Reviews</Nav.Link>
                  )}
                  <Nav.Link as={NavLink} to="/dashboard">Dashboard</Nav.Link>
                  <Nav.Link as={NavLink} to="/perfil">Mi Perfil</Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {currentUser ? (
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  <FaSignOutAlt className="me-1" /> Salir
                </Button>
              ) : (
                <>
                  <Nav.Link as={NavLink} to="/login">
                    <FaSignInAlt className="me-1" /> Ingresar
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/register">
                    <FaUserPlus className="me-1" /> Registrarse
                  </Nav.Link>
                </>
              )}
            </Nav>
          </BSNavbar.Collapse>
        </Container>
      </BSNavbar>
    </>
  );
};

export default Navbar;