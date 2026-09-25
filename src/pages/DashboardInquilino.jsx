import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Modal, Alert, Spinner, Badge, Form } from 'react-bootstrap';
import { FaStar, FaLink, FaCopy, FaReply, FaFlag, FaChartBar, FaUser, FaCheck, FaTrash, FaUserPlus, FaCheckCircle, FaTimesCircle, FaDownload, FaDollarSign, FaFileContract } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { createSolicitudToken, getCalificacionesByHash, getTokensByHash, addRespuesta, solicitarBloqueo, deleteToken, getInvitacionesByHash, aceptarInvitacion, rechazarInvitacion } from '../services/firestoreService';
import { getInitials } from '../utils/hash';
import { getPromedioByHash } from '../services/firestoreService';
import { uploadToCloudinary } from '../../cloudinary-upload';

const DashboardInquilino = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calificaciones, setCalificaciones] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [respondiendoId, setRespondiendoId] = useState(null);
  const [respuestaText, setRespuestaText] = useState('');
  const [respuestaPrueba, setRespuestaPrueba] = useState(null);
  const [consentimientoRespuesta, setConsentimientoRespuesta] = useState(false);
  const [savingRespuesta, setSavingRespuesta] = useState(false);
  const [bloqueoId, setBloqueoId] = useState(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [savingBloqueo, setSavingBloqueo] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [deleteTokenId, setDeleteTokenId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [invitaciones, setInvitaciones] = useState([]);
  const [aceptandoId, setAceptandoId] = useState(null);

  const loadData = async () => {
    try {
      const [califData, tokensData, promedioData, invitData] = await Promise.all([
        getCalificacionesByHash(userData.hash_cedula),
        getTokensByHash(userData.hash_cedula),
        getPromedioByHash(userData.hash_cedula),
        getInvitacionesByHash(userData.hash_cedula),
      ]);
      setCalificaciones(califData.slice(0, 5));
      setTokens(tokensData);
      setPromedio(promedioData);
      setInvitaciones(invitData);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.hash_cedula) loadData();
  }, [userData]);

  const handleGenerateLink = async () => {
    setGenerating(true);
    setError('');
    try {
      const token = await createSolicitudToken(userData.hash_cedula);
      setLinkGenerated(`${window.location.origin}/r/${token}`);
      setShowLinkModal(true);
    } catch {
      setError('Error al generar el link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleDeleteToken = async () => {
    setDeleting(true);
    try {
      await deleteToken(deleteTokenId);
      setDeleteTokenId(null);
      await loadData();
    } catch {
      setError('Error al eliminar el link');
    } finally {
      setDeleting(false);
    }
  };

  const handleAceptarInvitacion = async (invitacionId) => {
    setAceptandoId(invitacionId);
    setError('');
    try {
      await aceptarInvitacion(invitacionId, userData.uid);
      await loadData();
    } catch (err) {
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setAceptandoId(null);
    }
  };

  const handleRechazarInvitacion = async (invitacionId) => {
    setAceptandoId(invitacionId);
    setError('');
    try {
      await rechazarInvitacion(invitacionId);
      await loadData();
    } catch {
      setError('Error al rechazar la invitación');
    } finally {
      setAceptandoId(null);
    }
  };

  const handleResponder = async (calificacionId) => {
    if (!respuestaText.trim() || !consentimientoRespuesta) return;
    setSavingRespuesta(true);
    try {
      let pruebaUrl = '';
      if (respuestaPrueba) {
        pruebaUrl = await uploadToCloudinary(respuestaPrueba, 'inquilinoverificado');
      }
      await addRespuesta(calificacionId, respuestaText, pruebaUrl || null);
      setRespondiendoId(null);
      setRespuestaText('');
      setRespuestaPrueba(null);
      setConsentimientoRespuesta(false);
      await loadCalificaciones();
    } catch {
      setError('Error al enviar respuesta');
    } finally {
      setSavingRespuesta(false);
    }
  };

  const handleSolicitarBloqueo = async () => {
    if (!motivoBloqueo.trim()) return;
    setSavingBloqueo(true);
    try {
      await solicitarBloqueo(bloqueoId, motivoBloqueo);
      setBloqueoId(null);
      setMotivoBloqueo('');
      await loadCalificaciones();
    } catch {
      setError('Error al solicitar bloqueo');
    } finally {
      setSavingBloqueo(false);
    }
  };

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
              <h4 className="mb-1">Bienvenido, {userData?.nombre || 'Usuario'}!</h4>
              <p className="text-muted mb-0">Panel del Inquilino</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          {promedio && !promedio.oculto ? (
            <div className="d-flex align-items-center justify-content-around text-center">
              <div>
                <h1 className="text-warning mb-0">{promedio.promedio_general}</h1>
                <small className="text-muted">Promedio Global</small>
                <div className="mt-1">{getEstrellas(Math.round(promedio.promedio_general))}</div>
              </div>
              <div className="border-start ps-4">
                <h3 className="text-primary mb-0">{promedio.total_calificaciones}</h3>
                <small className="text-muted">Referencias</small>
              </div>
              <div className="border-start ps-4">
                <h3 className="text-success mb-0">{tokens.filter((t) => !t.usado).length}</h3>
                <small className="text-muted">Links Activos</small>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <FaStar className="text-warning mb-2" size={28} />
              <p className="mb-0 fw-bold">Sigue juntando referencias para activar tu perfil público</p>
              <small className="text-muted">Necesitas un promedio mínimo de 3.5/5 para activar tu perfil público</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {invitaciones.length > 0 && (
        <Card className="app-card mb-3 border-warning">
          <Card.Body className="p-4">
            <h5 className="mb-3"><FaUserPlus className="me-2 text-warning" />Invitaciones pendientes</h5>
            {invitaciones.map((inv) => (
              <div key={inv.id} className="border rounded p-3 mb-2">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <small className="fw-semibold">{inv.nombre_arrendador || 'Arrendador'}</small>
                    <small className="text-muted d-block">te ha invitado a crear tu perfil</small>
                  </div>
                  <Badge bg="warning" text="dark">Pendiente</Badge>
                </div>
                {inv.saludo && <p className="small text-muted mb-2">"{inv.saludo}"</p>}
                <div className="d-flex gap-2 mb-2">
                  <Button size="sm" variant="success" onClick={() => handleAceptarInvitacion(inv.id)} disabled={aceptandoId === inv.id} className="d-flex align-items-center gap-1">
                    {aceptandoId === inv.id ? <Spinner size="sm" /> : <FaCheckCircle />} Aceptar
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleRechazarInvitacion(inv.id)} disabled={aceptandoId === inv.id} className="d-flex align-items-center gap-1">
                    <FaTimesCircle /> Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1"><FaLink className="me-2 text-primary" />Link de Calificacion</h5>
              <p className="text-muted mb-0 small">Genere un link para compartir con su arrendador y recibir calificaciones</p>
            </div>
            <Button variant="primary" onClick={handleGenerateLink} disabled={generating} className="d-flex align-items-center gap-2">
              {generating ? <Spinner size="sm" /> : <FaLink />}
              Generar Link de Calificacion
            </Button>
          </div>
        </Card.Body>
      </Card>

      {tokens.length > 0 && (
        <Card className="app-card mb-3">
          <Card.Body className="p-4">
            <h5 className="mb-3"><FaLink className="me-2 text-secondary" />Links Generados</h5>
            {tokens.map((t) => {
              const link = `${window.location.origin}/r/${t.token}`;
              const expirado = t.fecha_expiracion?.toDate?.() && new Date(t.fecha_expiracion.toDate()) < new Date();
              const estado = t.usado ? 'Usado' : expirado ? 'Expirado' : 'Activo';
              const badgeVariant = t.usado ? 'secondary' : expirado ? 'danger' : 'success';
              return (
                <div key={t.id} className="d-flex flex-column border rounded p-3 mb-2">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <small className="text-break me-2" style={{ wordBreak: 'break-all' }}>{link}</small>
                    <Badge bg={badgeVariant} className="flex-shrink-0">{estado}</Badge>
                  </div>
                  <div className="d-flex gap-2">
                    {!t.usado && !expirado && (
                      <Button size="sm" variant={copiedLink === link ? 'success' : 'outline-primary'} onClick={() => handleCopyLink(link)} className="d-flex align-items-center gap-1">
                        {copiedLink === link ? <><FaCheck /><span>Copiado</span></> : <><FaCopy /><span>Copiar</span></>}
                      </Button>
                    )}
                    <Button size="sm" variant="outline-danger" onClick={() => setDeleteTokenId(t.id)} className="d-flex align-items-center gap-1">
                      <FaTrash /><span>Eliminar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card.Body>
        </Card>
      )}

      <Modal show={showLinkModal} onHide={() => { setShowLinkModal(false); setCopiedLink(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Link Generado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Comparta este link con su arrendador para que pueda calificarle:</p>
          <div className="input-group">
            <input type="text" className="form-control" value={linkGenerated} readOnly />
            <Button variant={copiedLink === linkGenerated ? 'success' : 'outline-primary'} onClick={() => handleCopyLink(linkGenerated)}>
              {copiedLink === linkGenerated ? <><FaCheck className="me-1" />Copiado</> : <><FaCopy className="me-1" />Copiar</>}
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowLinkModal(false); setCopiedLink(''); }}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-1"><FaFileContract className="me-2 text-primary" />Mis Contratos</h5>
              <p className="text-muted mb-0 small">Revisa el histórico de pagos de tus contratos</p>
            </div>
            <Link to="/mis-contratos" className="btn btn-sm btn-primary d-flex align-items-center gap-1">
              <FaFileContract /> Ver contratos
            </Link>
          </div>
        </Card.Body>
      </Card>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0"><FaStar className="me-2 text-warning" />Calificaciones Recientes</h5>
            {calificaciones.length > 0 && (
              <Link to="/mis-calificaciones" className="btn btn-sm btn-outline-primary">Ver todas</Link>
            )}
          </div>

          {calificaciones.length === 0 ? (
            <Alert variant="info" className="mb-0">
              <FaChartBar className="me-2" />Aun no tiene calificaciones. Genere un link y compartalo con su arrendador.
            </Alert>
          ) : (
            calificaciones.map((cal) => (
              <Card key={cal.id} className="mb-3 border">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted"><span className="badge bg-light text-dark border me-1">{getInitials(cal.arrendador_nombre)}</span>Arrendador</small>
                    <small className="text-muted">{cal.fecha ? format(cal.fecha, "d 'de' MMM 'de' yyyy", { locale: es }) : 'Sin fecha'}</small>
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
                      <small className="text-muted d-block">Comunicacion</small>
                      <div>{getEstrellas(cal.estrellas_comunicacion)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{cal.estrellas_comunicacion}/5</Badge>
                    </Col>
                  </Row>
                  {cal.comentario && <p className="mb-2 small">{cal.comentario}</p>}

                  {cal.respuesta_inquilino && (
                    <div className="bg-light p-2 rounded mb-2">
                      <small className="fw-semibold">Su respuesta:</small>
                      <p className="mb-1 small">{cal.respuesta_inquilino}</p>
                      {cal.prueba_respuesta_url && (
                        <a href={cal.prueba_respuesta_url} target="_blank" rel="noopener noreferrer" className="small" download>
                          Ver documento adjunto
                        </a>
                      )}
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {!cal.respuesta_inquilino && (
                      respondiendoId === cal.id ? (
                          <div className="w-100">
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={respuestaText}
                            onChange={(e) => setRespuestaText(e.target.value)}
                            placeholder="Escriba su respuesta..."
                            className="mb-2"
                          />
                          <Form.Control
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            onChange={(e) => setRespuestaPrueba(e.target.files[0] || null)}
                            className="mb-2"
                          />
                          <Form.Text className="text-muted small d-block mb-2">Opcional: adjunte un documento o imagen para respaldar su respuesta</Form.Text>
                          <Form.Check
                            type="checkbox"
                            id={`consentimiento-${cal.id}`}
                            label="Respondo bajo mi responsabilidad y doy consentimiento para que esta respuesta sea publicada junto a la review."
                            checked={consentimientoRespuesta}
                            onChange={(e) => setConsentimientoRespuesta(e.target.checked)}
                            className="mb-2 small"
                          />
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleResponder(cal.id)} disabled={savingRespuesta || !respuestaText.trim() || !consentimientoRespuesta}>
                              {savingRespuesta ? <Spinner size="sm" /> : <FaReply className="me-1" />}Enviar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => { setRespondiendoId(null); setRespuestaText(''); setConsentimientoRespuesta(false); }}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline-primary" onClick={() => setRespondiendoId(cal.id)}>
                          <FaReply className="me-1" />Responder
                        </Button>
                      )
                    )}
                    {!cal.prueba_url && !cal.bloqueo_solicitado && (
                      <Button size="sm" variant="outline-danger" onClick={() => setBloqueoId(cal.id)}>
                        <FaFlag className="me-1" />Solicitar Bloqueo
                      </Button>
                    )}
                    {cal.bloqueo_solicitado && (
                      <Badge bg="warning" text="dark">Bloqueo solicitado</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Card.Body>
      </Card>

      <Modal show={!!deleteTokenId} onHide={() => setDeleteTokenId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de eliminar este link? Los arrendadores que lo tengan ya no podrán usarlo.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTokenId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteToken} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : <FaTrash className="me-1" />}Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!bloqueoId} onHide={() => { setBloqueoId(null); setMotivoBloqueo(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Solicitar Bloqueo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Indique el motivo por el cual solicita el bloqueo de esta calificacion:</p>
          <Form.Control
            as="textarea"
            rows={3}
            value={motivoBloqueo}
            onChange={(e) => setMotivoBloqueo(e.target.value)}
            placeholder="Describa el motivo..."
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setBloqueoId(null); setMotivoBloqueo(''); }}>Cancelar</Button>
          <Button variant="danger" onClick={handleSolicitarBloqueo} disabled={savingBloqueo || !motivoBloqueo.trim()}>
            {savingBloqueo ? <Spinner size="sm" /> : <FaFlag className="me-1" />}Enviar Solicitud
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DashboardInquilino;
