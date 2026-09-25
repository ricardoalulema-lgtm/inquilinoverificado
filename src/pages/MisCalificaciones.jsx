import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, ProgressBar, Form, Alert, Modal } from 'react-bootstrap';
import { FaStar, FaReply, FaFlag, FaChartBar, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { getCalificacionesByHash, getPromedioByHash, addRespuesta, solicitarBloqueo } from '../services/firestoreService';
import { getInitials } from '../utils/hash';
import { uploadToCloudinary } from '../../cloudinary-upload';

const MisCalificaciones = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calificaciones, setCalificaciones] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [error, setError] = useState('');
  const [respondiendoId, setRespondiendoId] = useState(null);
  const [respuestaText, setRespuestaText] = useState('');
  const [respuestaPrueba, setRespuestaPrueba] = useState(null);
  const [consentimientoRespuesta, setConsentimientoRespuesta] = useState(false);
  const [savingRespuesta, setSavingRespuesta] = useState(false);
  const [bloqueoId, setBloqueoId] = useState(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [savingBloqueo, setSavingBloqueo] = useState(false);

  const loadData = async () => {
    try {
      const [califData, promedioData] = await Promise.all([
        getCalificacionesByHash(userData.hash_cedula),
        getPromedioByHash(userData.hash_cedula),
      ]);
      setCalificaciones(califData);
      setPromedio(promedioData);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.hash_cedula) loadData();
  }, [userData]);

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
      await loadData();
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
      await loadData();
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

      <h4 className="mb-4"><FaChartBar className="me-2 text-primary" />Mis Calificaciones</h4>

      {promedio && !promedio.oculto && (
        <Card className="app-card mb-3">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={4} className="text-center mb-3 mb-md-0">
                <h1 className="text-warning mb-0">{promedio.promedio_general}</h1>
                <small className="text-muted">Promedio General</small>
                <div className="mt-1">{getEstrellas(Math.round(promedio.promedio_general))}</div>
              </Col>
              <Col md={8}>
                <div className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>Puntualidad de Pago</span>
                    <span className="fw-semibold">{promedio.detalle_ejes.puntualidad_pago}</span>
                  </div>
                  <ProgressBar now={parseFloat(promedio.detalle_ejes.puntualidad_pago) * 20} variant="warning" className="mb-2" style={{ height: 8 }} />
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>Cuidado del Inmueble</span>
                    <span className="fw-semibold">{promedio.detalle_ejes.cuidado_inmueble}</span>
                  </div>
                  <ProgressBar now={parseFloat(promedio.detalle_ejes.cuidado_inmueble) * 20} variant="warning" className="mb-2" style={{ height: 8 }} />
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>Comunicacion</span>
                    <span className="fw-semibold">{promedio.detalle_ejes.comunicacion}</span>
                  </div>
                  <ProgressBar now={parseFloat(promedio.detalle_ejes.comunicacion) * 20} variant="warning" style={{ height: 8 }} />
                </div>
                <small className="text-muted">Basado en {promedio.total_calificaciones} calificacion(es)</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {promedio?.oculto && (
        <Alert variant="warning" className="mb-4">
          Su perfil esta actualmente oculto debido a un promedio bajo. Siga recibiendo calificaciones positivas para mejorarlo.
        </Alert>
      )}

      {calificaciones.length === 0 ? (
        <Alert variant="info">No tiene calificaciones registradas. Genere un link de calificacion para recibir su primera evaluacion.</Alert>
      ) : (
        calificaciones.map((cal) => (
          <Card key={cal.id} className="mb-3 shadow-sm border">
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

export default MisCalificaciones;
