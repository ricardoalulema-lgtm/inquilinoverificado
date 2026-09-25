import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getInvitacionByToken, aceptarInvitacion, rechazarInvitacion } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

const ReclamarInvitacion = () => {
  const { token } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [invitacion, setInvitacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getInvitacionByToken(token);
        if (!data) {
          setError('Invitación no válida o expirada');
        } else if (data.estado !== 'pending') {
          setError('Esta invitación ya fue procesada');
        } else {
          setInvitacion(data);
        }
      } catch {
        setError('Error al cargar la invitación');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAceptar = async () => {
    if (!currentUser) return;
    setProcessing(true);
    setError('');
    try {
      await aceptarInvitacion(invitacion.id, currentUser.uid);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setProcessing(false);
    }
  };

  const handleRechazar = async () => {
    setProcessing(true);
    setError('');
    try {
      await rechazarInvitacion(invitacion.id);
      navigate('/');
    } catch {
      setError('Error al rechazar la invitación');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error && !invitacion) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaTimesCircle className="text-danger mb-3" size={48} />
            <h4>Invitación no disponible</h4>
            <p className="text-muted">{error}</p>
            <Button as={Link} to="/" variant="primary">Ir al inicio</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaCheckCircle className="text-success mb-3" size={48} />
            <h4>¡Bienvenido a GoodRenter!</h4>
            <p className="text-muted">Has aceptado la invitación. Tu perfil está listo para recibir calificaciones de {invitacion?.nombre_arrendador}.</p>
            <Button as={Link} to="/dashboard/inquilino" variant="primary">Ir a mi dashboard</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaUser className="text-primary mb-3" size={48} />
            <h4>{invitacion?.nombre_arrendador || 'Un arrendador'} te ha invitado a GoodRenter</h4>
            <p className="text-muted mb-1">
              <strong>{invitacion?.nombre_arrendador || 'Un arrendador'}</strong> quiere gestionar tus pagos de arriendo a través de GoodRenter. Al registrarte quedarás vinculado a él y podrás recibir comprobantes de pago por WhatsApp.
            </p>
            <p className="text-muted mb-4">Crea tu cuenta para empezar.</p>
            <div className="d-grid">
              <Button variant="primary" size="lg" onClick={() => navigate(`/register?redirect=/i/${token}`)}>
                Registrarme
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      <Card className="app-card mb-3">
        <Card.Body className="p-4 text-center">
          <div className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 64, height: 64 }}>
            <FaUser className="text-primary" size={28} />
          </div>
          <h4>Invitación de {invitacion.nombre_arrendador}</h4>
          <p className="text-muted">
            <strong>{invitacion.nombre_arrendador}</strong> te ha invitado a crear tu perfil en GoodRenter para que puedas recibir referencias de arrendamiento verificadas.
          </p>
          {invitacion.saludo && (
            <div className="bg-light rounded p-3 mb-3">
              <p className="small mb-0 text-muted" style={{ whiteSpace: 'pre-line' }}>"{invitacion.saludo}"</p>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <small className="text-muted d-block text-start" style={{ opacity: 0.6, fontSize: '0.75rem', lineHeight: 1.3 }}>
            Al aceptar, {invitacion.nombre_arrendador} podrá referenciarte como inquilino. Conforme a la LOPDP, tú controlas tu información: decide si tu perfil es público y solicita la eliminación de tus datos en cualquier momento.
          </small>

          <div className="d-flex gap-2">
            <Button variant="primary" className="flex-fill" onClick={handleAceptar} disabled={processing}>
              {processing ? <Spinner size="sm" /> : <><FaCheckCircle className="me-1" />Aceptar</>}
            </Button>
            <Button variant="outline-danger" className="flex-fill" onClick={handleRechazar} disabled={processing}>
              <FaTimesCircle className="me-1" />Rechazar
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReclamarInvitacion;