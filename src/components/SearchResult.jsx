import { useState } from 'react';
import { Card, Row, Col, ProgressBar, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaStar, FaUser, FaIdCard, FaPen, FaWhatsapp, FaCopy, FaCheck, FaUserPlus, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBotProtection } from '../hooks/useBotProtection';
import { createInvitacion } from '../services/firestoreService';
import { hashCedula } from '../utils/hash';

const getInitials = (nombre) => {
  if (!nombre) return '??';
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
};

const axisLabels = {
  puntualidad_pago: 'Pago puntual',
  cuidado_inmueble: 'Cuidado del inmueble',
  comunicacion: 'Comunicación',
};

const ResultadoVerificado = ({ data, cedula }) => {
  const navigate = useNavigate();
  const { inquilino_nombre, cedula_mascarada, promedio_general, total_calificaciones, total_arrendadores, detalle_ejes } = data;
  const progressPercent = promedio_general ? Math.round((promedio_general / 5) * 100) : 0;

  return (
    <Card className="app-card mb-3">
      <div className="bg-success text-white text-center py-3 rounded-top" style={{ borderRadius: '16px 16px 0 0' }}>
        <FaCheckCircle size={32} />
        <h4 className="mb-0 mt-1">Inquilino Verificado</h4>
      </div>
      <Card.Body className="p-4">
        <div className="text-center mb-4">
          <div className="bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style={{ width: 72, height: 72 }}>
            <span className="fs-3 fw-bold text-success">{getInitials(inquilino_nombre)}</span>
          </div>
          <h5 className="mb-1">{inquilino_nombre}</h5>
          <small className="text-muted"><FaIdCard className="me-1" />{cedula_mascarada}</small>
        </div>

        <div className="text-center mb-3">
          <div className="display-4 fw-bold text-success">{promedio_general?.toFixed(1)}</div>
          <small className="text-muted">de 5 estrellas</small>
          <div className="mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <FaStar key={s} size={24} className="mx-1" color={s <= Math.round(promedio_general) ? '#ffc107' : '#e9ecef'} />
            ))}
          </div>
        </div>

        <div className="bg-light rounded p-3 mb-4 text-center">
          <strong className="fs-5">{total_calificaciones}</strong>
          <small className="text-muted d-block">referencia{total_calificaciones !== 1 ? 's' : ''} de {total_arrendadores} arrendador{total_arrendadores !== 1 ? 'es' : ''}</small>
        </div>

        {detalle_ejes && Object.keys(detalle_ejes).length > 0 && (
          <>
            <h6 className="mb-3">Detalle por eje</h6>
            {Object.entries(detalle_ejes).map(([key, val]) => (
              <div key={key} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>{axisLabels[key] || key}</small>
                  <small className="fw-bold">{val?.toFixed(1)} / 5</small>
                </div>
                <ProgressBar
                  now={val ? (val / 5) * 100 : 0}
                  variant="success"
                  style={{ height: 10, borderRadius: 8 }}
                />
              </div>
            ))}
          </>
        )}

        <div className="text-center mt-4">
          <small className="text-muted">Datos anónimos cumpliendo con la LOPDP</small>
        </div>

        <div className="d-grid mt-3">
          <Button variant="success" size="lg" onClick={() => navigate(`/calificar/${cedula}`)} className="d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 12 }}>
            <FaPen /> Calificar a este inquilino
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const ResultadoNoDisponible = ({ data }) => {

  return (
    <Card className="app-card mb-3">
      <div className="bg-warning text-dark text-center py-3 rounded-top" style={{ borderRadius: '16px 16px 0 0' }}>
        <FaExclamationTriangle size={32} />
        <h4 className="mb-0 mt-1">Perfil no disponible públicamente</h4>
      </div>
      <Card.Body className="p-4">
        {data.inquilino_nombre && (
          <div className="text-center mb-3">
            <h5 className="mb-1">{data.inquilino_nombre}</h5>
            <small className="text-muted"><FaIdCard className="me-1" />{data.cedula_mascarada}</small>
          </div>
        )}

        <div className="bg-light rounded p-3 mb-3">
          <p className="mb-2">
            Este perfil no cumple con los requisitos mínimos de la plataforma para mostrar una calificación.
          </p>
          <p className="mb-0 small text-muted">
            <strong>Requisito:</strong> Promedio mínimo de 3.5/5
          </p>
        </div>

        <div className="alert alert-info border-0 py-3" role="alert">
          <FaExclamationTriangle className="me-1" />
          La ausencia de calificación no significa que el inquilino sea malo. Solo significa que no hay suficientes referencias positivas verificadas en esta plataforma.
        </div>

        <div className="bg-light rounded p-3 mb-3">
          <p className="small mb-2 text-muted">
            <strong>Recomendación:</strong> Solicite al inquilino referencias externas como cartas o garantes.
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

const SinDatos = ({ data, cedula }) => {
  const { currentUser, userData } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invitacionLink, setInvitacionLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [nombreInq, setNombreInq] = useState('');
  const [telefonoInq, setTelefonoInq] = useState('');
  const [saludo, setSaludo] = useState('');
  const { honeypotRef, captchaA, captchaB, captchaValue, setCaptchaValue, validate } = useBotProtection();

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!validate()) { setError('Error de validación. Intenta de nuevo.'); return; }
    if (!nombreInq.trim()) { setError('El nombre del inquilino es obligatorio'); return; }
    if (!/^\+?\d{7,15}$/.test(telefonoInq.replace(/\s/g, ''))) { setError('Número de teléfono inválido'); return; }
    setSubmitting(true);
    setError('');
    try {
      const hash = hashCedula(cedula);
      const { id } = await createInvitacion({
        hash_cedula_inquilino: hash,
        nombre_inquilino: nombreInq.trim(),
        telefono_inquilino: telefonoInq.replace(/\s/g, ''),
        saludo: saludo.trim(),
        uid_arrendador: currentUser.uid,
        nombre_arrendador: userData.nombre || '',
      });
      setInvitacionLink(`${window.location.origin}/i/${id}`);
    } catch (err) {
      setError(err.message || 'Error al crear la invitacion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(invitacionLink); }
    catch {
      const textarea = document.createElement('textarea');
      textarea.value = invitacionLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsappText = encodeURIComponent(
    `${saludo ? saludo + '\n\n' : ''}Hola ${nombreInq},\n\nEl/la Sr(a). ${userData?.nombre || 'Un arrendador'} te ha mencionado como referencia de arrendamiento en GoodRenter.\n\nPara ver tu perfil y las calificaciones que recibas, reclama tu cuenta aquí: ${invitacionLink}\n\nImportante:\n1. Tú decides si tu perfil es público o no.\n2. Puedes solicitar que se eliminen tus datos en cualquier momento contactándote con nuestro sitio.\n3. Conoce nuestro Aviso de Privacidad: ${window.location.origin}/privacidad\n4. Este link de invitación expira en 1 mes.\n\nGoodRenter - Referencias de arrendamiento verificadas.`
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setInvitacionLink('');
    setCopied(false);
    setError('');
    setNombreInq('');
    setTelefonoInq('');
    setSaludo('');
  };

  return (
    <>
      <Card className="app-card mb-3">
        <Card.Body className="p-4 text-center">
          <FaUser size={48} className="text-muted mb-3" />
          <h5>Sin perfil</h5>
          <p className="text-muted mb-3">No se encontraron referencias para esta cédula.</p>
          <Alert variant="info" className="border-0 py-3 text-start">
            <FaInfoCircle className="me-2" />
            Ningún perfil se crea sin notificación al titular. Usted será avisado si un arrendador lo menciona.
          </Alert>
          <div className="d-grid gap-2 mt-3">
            <Button variant="primary" size="lg" onClick={() => setShowModal(true)} className="d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 12 }}>
              <FaUserPlus /> Invitar a crear perfil
            </Button>
            <Link to={`/calificar/${cedula}`} className="btn btn-outline-warning btn-lg d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 12 }}>
              <FaStar /> Calificar directamente
            </Link>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} centered size={invitacionLink ? 'md' : 'md'}>
        <Modal.Header closeButton>
          <Modal.Title>{invitacionLink ? 'Invitación creada' : 'Invitar a crear perfil'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          {invitacionLink ? (
            <>
              <Alert variant="success" className="border-0">
                <FaCheckCircle className="me-2" />Invitación creada exitosamente.
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Link de invitación</Form.Label>
                <div className="input-group">
                  <Form.Control type="text" value={invitacionLink} readOnly />
                  <Button variant={copied ? 'success' : 'outline-primary'} onClick={handleCopy}>
                    {copied ? <><FaCheck className="me-1" />Copiado</> : <><FaCopy className="me-1" />Copiar</>}
                  </Button>
                </div>
              </Form.Group>

              <div className="d-grid mb-3">
                <Button variant="success" size="lg" href={`https://wa.me/${telefonoInq.replace(/[^0-9]/g, '')}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 12 }}>
                  <FaWhatsapp size={24} /> Enviar por WhatsApp
                </Button>
              </div>

              <div className="bg-light rounded p-3">
                <small className="text-muted d-block mb-2 fw-semibold">Vista previa del mensaje:</small>
                {(() => {
                  const texto = decodeURIComponent(whatsappText);
                  const idx = texto.indexOf('Importante:');
                  if (idx === -1) return <p className="small mb-0 text-muted" style={{ whiteSpace: 'pre-line' }}>{texto}</p>;
                  return (
                    <>
                      <p className="mb-2 fw-semibold" style={{ whiteSpace: 'pre-line', color: '#075e54' }}>
                        {texto.substring(0, idx)}
                      </p>
                      <small className="text-muted" style={{ whiteSpace: 'pre-line', opacity: 0.6 }}>
                        {texto.substring(idx)}
                      </small>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <Form onSubmit={handleInvitar}>
              <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                <label htmlFor="honeypot-sin">No llenar</label>
                <input id="honeypot-sin" name="honeypot" type="text" ref={honeypotRef} tabIndex={-1} autoComplete="off" />
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del inquilino <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" value={nombreInq} onChange={(e) => setNombreInq(e.target.value)} placeholder="Ej: Juan Pérez" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono (WhatsApp) <span className="text-danger">*</span></Form.Label>
                <Form.Control type="tel" value={telefonoInq} onChange={(e) => setTelefonoInq(e.target.value.replace(/[^0-9+ ]/g, ''))} placeholder="+593 99 999 9999" />
                <Form.Text className="text-muted">Ingresa el número con código de país (ej: +593...)</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Texto de saludo (opcional)</Form.Label>
                <Form.Control as="textarea" rows={2} value={saludo} onChange={(e) => setSaludo(e.target.value)} placeholder="Opcional: escribe un saludo personalizado" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Verificación de seguridad</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">{captchaA} + {captchaB} = ?</span>
                  <Form.Control type="number" value={captchaValue} onChange={(e) => setCaptchaValue(e.target.value)} placeholder="Resultado" required />
                </div>
              </Form.Group>
              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={submitting} className="d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 12 }}>
                  {submitting ? <Spinner size="sm" /> : <FaUserPlus />} Generar invitación
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
        {invitacionLink && (
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

const SearchResult = ({ result, cedula }) => {
  if (!result) {
    return <SinDatos />;
  }

  if (result.tipo === 'verificado') {
    return <ResultadoVerificado data={result} cedula={cedula} />;
  }

  if (result.tipo === 'registrado') {
    return (
      <Card className="app-card mb-3">
        <Card.Body className="p-4 text-center">
          <FaUser size={48} className="text-primary mb-3" />
          <h5>{result.inquilino_nombre || 'Inquilino'}</h5>
          <p className="text-muted">{result.cedula_mascarada}</p>
          <Alert variant="info" className="border-0 py-3">
            Este inquilino ya está registrado en GoodRenter pero aún no tiene calificaciones. El inquilino está a la espera de su primera calificación dentro del sitio.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  if (result.tipo === 'oculto') {
    return <ResultadoNoDisponible data={result} />;
  }

  return <SinDatos data={result} cedula={cedula} />;
};

export default SearchResult;