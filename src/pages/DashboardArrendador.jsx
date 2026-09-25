import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Badge, Alert, Modal } from 'react-bootstrap';
import { FaStar, FaSearch, FaChartBar, FaUser, FaIdCard, FaDownload, FaLink, FaCopy, FaCheck, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { getUserCalificaciones, getInvitacionesByArrendador, deleteInvitacion } from '../services/firestoreService';
import { getInitials } from '../utils/hash';

const DashboardArrendador = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [calificaciones, setCalificaciones] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, invData] = await Promise.all([
          getUserCalificaciones(currentUser.uid),
          getInvitacionesByArrendador(currentUser.uid),
        ]);
        setCalificaciones(data);
        setInvitaciones(invData);
      } catch {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const handleDeleteInvitacion = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteInvitacion(deleteId);
      setDeleteId(null);
      const invData = await getInvitacionesByArrendador(currentUser.uid);
      setInvitaciones(invData);
    } catch {
      setError('Error al eliminar invitación');
    } finally {
      setDeleting(false);
    }
  };

  const totalCalificaciones = calificaciones.length;
  const totalInvitaciones = invitaciones.length;
  const inquilinosUnicos = [];
  const seen = new Set();
  calificaciones.forEach((c) => {
    if (!seen.has(c.hash_cedula_inquilino)) {
      seen.add(c.hash_cedula_inquilino);
      const finContrato = c.fecha_fin_contrato ? parseISO(c.fecha_fin_contrato) : null;
      inquilinosUnicos.push({ ...c, contratoActivo: finContrato ? isAfter(finContrato, new Date()) : false });
    }
  });
  const contratosActivos = inquilinosUnicos.filter((i) => i.contratoActivo).length;

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
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
              <FaUser className="text-primary" size={24} />
            </div>
            <div>
              <h4 className="mb-1">Bienvenido, {userData?.nombre || 'Arrendador'}!</h4>
              <p className="text-muted mb-0">Panel del Arrendador</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Row className="mb-4 g-3">
        <Col md={6}>
          <Card className="app-card mb-3">
            <Card.Body className="p-4 d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <FaSearch className="text-primary me-2" size={20} />
                <h5 className="mb-0">Buscar Inquilino</h5>
              </div>
              <p className="text-muted small flex-grow-1">Consulte el historial de calificaciones de un inquilino ingresando su numero de cedula.</p>
              <Button variant="primary" onClick={() => navigate('/buscar')}>
                <FaSearch className="me-1" /> Buscar Inquilino
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="app-card mb-3">
            <Card.Body className="p-4 d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <FaChartBar className="text-success me-2" size={20} />
                <h5 className="mb-0">Estadisticas</h5>
              </div>
              <div className="d-flex justify-content-around text-center flex-grow-1 align-items-center">
                <div>
                  <h3 className="text-primary mb-0">{totalCalificaciones}</h3>
                  <small className="text-muted">Calificaciones emitidas</small>
                </div>
                <div className="border-start ps-3">
                  <h3 className="text-warning mb-0">{totalInvitaciones}</h3>
                  <small className="text-muted">Invitaciones enviadas</small>
                </div>
                <div className="border-start ps-3">
                  <h3 className="text-success mb-0">{contratosActivos}</h3>
                  <small className="text-muted">Contratos activos</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {invitaciones.length > 0 && (
        <Card className="app-card mb-3">
          <Card.Body className="p-4">
            <h5 className="mb-3"><FaUserPlus className="me-2 text-primary" />Invitaciones enviadas</h5>
            {invitaciones.slice(0, 5).map((inv) => {
              const link = `${window.location.origin}/i/${inv.id}`;
              const estadoBadge = inv.expirado ? 'danger' : inv.estado === 'accepted' ? 'success' : inv.estado === 'rejected' ? 'secondary' : 'warning';
              const estadoLabel = inv.expirado ? 'Expirado' : inv.estado === 'accepted' ? 'Aceptado' : inv.estado === 'rejected' ? 'Rechazado' : 'Pendiente';
              return (
                <div key={inv.id} className="border rounded p-3 mb-2">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <small className="fw-semibold">{inv.nombre_inquilino || 'Inquilino'}</small>
                      <small className="text-muted d-block">{inv.telefono_inquilino || ''}</small>
                    </div>
                    <Badge bg={estadoBadge} text={estadoBadge === 'warning' ? 'dark' : 'white'}>{estadoLabel}</Badge>
                  </div>
                  <small className="text-break d-block mb-2" style={{ wordBreak: 'break-all' }}>{link}</small>
                  {inv.estado === 'pending' && !inv.expirado && (
                    <div className="d-flex gap-2">
                      <Button size="sm" variant={copiedLink === link ? 'success' : 'outline-primary'} onClick={() => { navigator.clipboard.writeText(link); setCopiedLink(link); setTimeout(() => setCopiedLink(''), 2000); }} className="d-flex align-items-center gap-1">
                        {copiedLink === link ? <><FaCheck /><span>Copiado</span></> : <><FaCopy /><span>Copiar link</span></>}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setDeleteId(inv.id)} className="d-flex align-items-center gap-1">
                        <FaTrash />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {invitaciones.length > 5 && (
              <div className="text-center mt-2">
                <span className="text-muted small">Mostrando 5 de {invitaciones.length} invitaciones</span>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <h5 className="mb-3"><FaStar className="me-2 text-warning" />Mis Calificaciones</h5>
          {calificaciones.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No ha realizado ninguna calificacion aun. <Link to="/buscar">Busque un inquilino</Link> para comenzar.
            </Alert>
          ) : (
            calificaciones.slice(0, 5).map((cal) => (
              <Card key={cal.id} className="mb-3 border">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted"><span className="badge bg-light text-dark border me-1">{getInitials(cal.inquilino_nombre)}</span><FaIdCard className="me-1" />{cal.cedula_inquilino || 'Cédula no disponible'}</small>
                    <small className="text-muted">{cal.fecha ? format(cal.fecha, "d 'de' MMM 'de' yyyy", { locale: es }) : 'Sin fecha'}</small>
                  </div>
                  <Row className="g-2 mb-2">
                    <Col xs={4} md={3}>
                      <small className="text-muted d-block">Pago</small>
                      <div>{getEstrellas(cal.estrellas_pago)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_pago}/5</Badge>
                    </Col>
                    <Col xs={4} md={3}>
                      <small className="text-muted d-block">Cuidado</small>
                      <div>{getEstrellas(cal.estrellas_cuidado)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_cuidado}/5</Badge>
                    </Col>
                    <Col xs={4} md={3}>
                      <small className="text-muted d-block">Comunicacion</small>
                      <div>{getEstrellas(cal.estrellas_comunicacion)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_comunicacion}/5</Badge>
                    </Col>
                  </Row>
                  {cal.comentario && <p className="small mb-1">{cal.comentario}</p>}
                  {cal.prueba_url && (
                    <a href={cal.prueba_url} target="_blank" rel="noopener noreferrer" className="small" download>
                      <FaDownload className="me-1" />Descargar documento de verificación
                    </a>
                  )}
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
          {calificaciones.length > 5 && (
            <div className="text-center mt-2">
              <span className="text-muted small">Mostrando 5 de {calificaciones.length} calificaciones</span>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar invitación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de eliminar esta invitación? El inquilino ya no podrá usarla.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteInvitacion} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : <FaTrash className="me-1" />} Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DashboardArrendador;
