import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { saveCalificacion, getCalificacionByUidAndHash } from '../services/firestoreService';
import { hashCedula } from '../utils/hash';
import { uploadToCloudinary } from '../../cloudinary-upload';
import RatingForm from '../components/RatingForm';

const CalificarDirecto = () => {
  const { cedula } = useParams();
  const { currentUser, userData } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentoRequerido, setDocumentoRequerido] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const hash = hashCedula(cedula);
        const existing = await getCalificacionByUidAndHash(currentUser.uid, hash);
        setDocumentoRequerido(!existing);
      } catch {
        setDocumentoRequerido(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [currentUser, cedula]);

  const handleSubmit = async (values) => {
    if (!currentUser || !userData) return;
    setSubmitting(true);
    setError('');
    try {
      const hash = hashCedula(cedula);
      let pruebaUrl = '';
      if (values.prueba) {
        pruebaUrl = await uploadToCloudinary(values.prueba, 'inquilinoverificado');
      }

      const calificacionData = {
        hash_cedula_inquilino: hash,
        uid_arrendador: currentUser.uid,
        nombre_arrendador: userData.nombre || '',
        hash_cedula_arrendador: userData.hash_cedula || '',
        cedula_mascarada_arrendador: userData.cedula_mascarada || '',
        estrellas_pago: values.estrellas_pago,
        estrellas_cuidado: values.estrellas_cuidado,
        estrellas_comunicacion: values.estrellas_comunicacion,
        comentario: values.comentario || '',
        prueba_url: pruebaUrl || null,
        fecha_inicio_contrato: values.fecha_inicio_contrato,
        fecha_fin_contrato: values.fecha_fin_contrato,
      };

      await saveCalificacion(calificacionData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al guardar la calificacion');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Container className="page-container">
        <Card className="app-card mb-3">
          <Card.Body className="p-4 text-center">
            <FaCheckCircle className="text-success mb-3" size={48} />
            <h4>Calificación enviada!</h4>
            <p className="text-muted">Su calificación ha sido registrada exitosamente.</p>
            <Button as={Link} to="/buscar" variant="primary" className="me-2">Volver a búsqueda</Button>
            <Button as={Link} to="/dashboard/arrendador" variant="outline-primary">Ir al Dashboard</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      <Link to="/buscar" className="btn btn-outline-secondary btn-sm mb-3">
        <FaArrowLeft className="me-1" /> Volver a búsqueda
      </Link>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <h4 className="mb-1">Calificar Inquilino</h4>
          <p className="text-muted small mb-4">Cédula: {cedula}. Su calificación ayuda a la comunidad de arrendadores. Sus datos personales se adjuntarán internamente para verificación y no serán visibles para el inquilino.</p>
          {checking ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : (
            <RatingForm onSubmit={handleSubmit} submitting={submitting} documentoRequerido={documentoRequerido} />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CalificarDirecto;