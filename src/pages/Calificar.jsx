import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getTokenData, saveCalificacion } from '../services/firestoreService';
import { uploadToCloudinary } from '../../cloudinary-upload';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import RatingForm from '../components/RatingForm';

const Calificar = () => {
  const { token } = useParams();
  const { currentUser, userData } = useAuth();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const data = await getTokenData(token);
        if (!data) {
          setError('Link invalido o expirado');
        } else if (data.usado) {
          setError('Este link ya ha sido utilizado');
        } else if (data.fecha_expiracion?.toDate?.() && new Date(data.fecha_expiracion.toDate()) < new Date()) {
          setError('Link invalido o expirado');
        } else {
          setTokenData(data);
        }
      } catch {
        setError('Error al validar el link');
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, [token]);

  const handleSubmit = async (values) => {
    if (!currentUser || !userData) return;
    setSubmitting(true);
    setError('');
    try {
      const pruebaUrl = await uploadToCloudinary(values.prueba, 'inquilinoverificado');

      const calificacionData = {
        token,
        hash_cedula_inquilino: tokenData.hash_cedula_inquilino,
        uid_arrendador: currentUser.uid,
        nombre_arrendador: userData.nombre || '',
        hash_cedula_arrendador: userData.hash_cedula || '',
        cedula_mascarada_arrendador: userData.cedula_mascarada || '',
        estrellas_pago: values.estrellas_pago,
        estrellas_cuidado: values.estrellas_cuidado,
        estrellas_comunicacion: values.estrellas_comunicacion,
        comentario: values.comentario || '',
        prueba_url: pruebaUrl,
        fecha_inicio_contrato: values.fecha_inicio_contrato,
        fecha_fin_contrato: values.fecha_fin_contrato,
      };

      await saveCalificacion(calificacionData);
      await updateDoc(doc(db, 'tokens_solicitud', tokenData.id), { usado: true });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al guardar la calificacion');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaExclamationTriangle className="text-danger mb-3" size={48} />
            <h4>Link invalido o expirado</h4>
            <p className="text-muted">Este link de calificacion no es valido o ha expirado. Solicite un nuevo link al inquilino.</p>
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
            <h4>Calificacion enviada!</h4>
            <p className="text-muted">Su calificacion ha sido registrada exitosamente.</p>
            <div className="mt-3">
              {!currentUser && (
                <div className="mb-3">
                  <p className="small text-muted">Registrese para hacer seguimiento de sus calificaciones.</p>
                  <Button as={Link} to="/registro" variant="primary" className="me-2">Registrarse</Button>
                  <Button as={Link} to="/login" variant="outline-primary">Iniciar Sesion</Button>
                </div>
              )}
              <Button as={Link} to="/" variant="link">Volver al inicio</Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!currentUser && tokenData) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaExclamationTriangle className="text-warning mb-3" size={48} />
            <h4>Inicie sesion para calificar</h4>
            <p className="text-muted">Debe iniciar sesion o registrarse para poder calificar a este inquilino.</p>
            <Button as={Link} to={`/login?redirect=/r/${token}`} variant="primary" className="me-2">Iniciar Sesion</Button>
            <Button as={Link} to={`/registro?redirect=/r/${token}`} variant="outline-primary">Registrarse</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {currentUser && tokenData && (
        <Card className="app-card mb-3">
          <Card.Body className="p-4">
          <h4 className="mb-1">Calificar Inquilino</h4>
          <p className="text-muted small mb-4">Su calificación ayuda a la comunidad de arrendadores. Sus datos personales se adjuntarán internamente para verificación y no serán visibles para el inquilino.</p>
          <RatingForm onSubmit={handleSubmit} submitting={submitting} />
        </Card.Body>
      </Card>
      )}
    </Container>
  );
};

export default Calificar;
