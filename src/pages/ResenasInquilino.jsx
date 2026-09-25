import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaArrowLeft, FaUser, FaIdCard } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { hashCedula, maskCedula, getInitials } from '../utils/hash';
import { getCalificacionesByHash, getPromedioByHash } from '../services/firestoreService';

const ResenasInquilino = () => {
  const { cedula } = useParams();
  const [loading, setLoading] = useState(true);
  const [calificaciones, setCalificaciones] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const hash = hashCedula(cedula);
        const [califData, promedioData] = await Promise.all([
          getCalificacionesByHash(hash),
          getPromedioByHash(hash),
        ]);
        setCalificaciones(califData);
        setPromedio(promedioData);
      } catch {
        setError('Error al cargar reseñas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cedula]);

  const getEstrellas = (valor) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(<FaStar key={i} className={i <= valor ? 'text-warning' : 'text-secondary'} size={14} />);
    }
    return estrellas;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="page-container">
      <Link to="/buscar" className="btn btn-outline-secondary btn-sm mb-3">
        <FaArrowLeft className="me-1" /> Volver a búsqueda
      </Link>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <h5 className="mb-3">Reseñas de {maskCedula(cedula)}</h5>
          {promedio && !promedio.oculto && (
            <div className="d-flex align-items-center gap-3 mb-2">
              <h2 className="text-warning mb-0">{promedio.promedio_general}</h2>
              <div>
                <div>{getEstrellas(Math.round(promedio.promedio_general))}</div>
                <small className="text-muted">{promedio.total_calificaciones} calificaciones</small>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {calificaciones.length === 0 ? (
        <Alert variant="info">Este inquilino aún no tiene reseñas.</Alert>
      ) : (
        calificaciones.map((cal) => (
          <Card key={cal.id} className="mb-3 border">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">
                  <FaUser className="me-1" />
                  <span className="badge bg-light text-dark border me-1">{getInitials(cal.arrendador_nombre)}</span>Arrendador
                </small>
                <small className="text-muted">
                  {cal.fecha ? format(cal.fecha, "d 'de' MMM 'de' yyyy", { locale: es }) : 'Sin fecha'}
                </small>
              </div>
              <Row className="g-2 mb-2">
                <Col xs={4}>
                  <small className="text-muted d-block">Pago</small>
                  <div>{getEstrellas(cal.estrellas_pago)}</div>
                  <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_pago}/5</Badge>
                </Col>
                <Col xs={4}>
                  <small className="text-muted d-block">Cuidado</small>
                  <div>{getEstrellas(cal.estrellas_cuidado)}</div>
                  <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_cuidado}/5</Badge>
                </Col>
                <Col xs={4}>
                  <small className="text-muted d-block">Comunicación</small>
                  <div>{getEstrellas(cal.estrellas_comunicacion)}</div>
                  <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_comunicacion}/5</Badge>
                </Col>
              </Row>
              {cal.comentario && <p className="small mb-1 mt-2 border-top pt-2">{cal.comentario}</p>}
              {cal.respuesta_inquilino && (
                <div className="bg-light p-2 rounded mt-2">
                  <small className="fw-semibold">Respuesta del inquilino:</small>
                  <p className="mb-1 small">{cal.respuesta_inquilino}</p>
                  {cal.prueba_respuesta_url && (
                    <a href={cal.prueba_respuesta_url} target="_blank" rel="noopener noreferrer" className="small" download>
                      Ver documento adjunto
                    </a>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default ResenasInquilino;