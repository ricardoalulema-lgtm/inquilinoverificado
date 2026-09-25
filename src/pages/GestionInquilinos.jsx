import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Badge, Alert, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaUsers, FaIdCard, FaMoneyBillWave, FaWhatsapp, FaPlus, FaHistory, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaFileUpload, FaDownload, FaCalendarAlt, FaEdit, FaDollarSign, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getVinculacionesByArrendador, getPagosByVinculacion, getResumenPagos, createPago, marcarPagoEnviado, activarVinculacion, updateMontoArriendo, updateDiaCorte, saveCalificacion, getCalificacionByUidAndHash } from '../services/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../../cloudinary-upload';
import RatingForm from '../components/RatingForm';

const GestionInquilinos = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inquilinos, setInquilinos] = useState([]);
  const [selectedInquilino, setSelectedInquilino] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [resumenPagos, setResumenPagos] = useState([]);
  const [montoMensual, setMontoMensual] = useState(0);
  const [montoEdit, setMontoEdit] = useState('');
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [diaCorte, setDiaCorte] = useState(15);
  const [diaCorteEdit, setDiaCorteEdit] = useState('15');
  const [editandoCorte, setEditandoCorte] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagoForm, setPagoForm] = useState({ monto: '', concepto: '', fecha_pago: '', nota: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [calificarHash, setCalificarHash] = useState('');
  const [calificarExitoso, setCalificarExitoso] = useState(false);
  const [documentoRequerido, setDocumentoRequerido] = useState(true);
  const [showActivarModal, setShowActivarModal] = useState(false);
  const [activandoId, setActivandoId] = useState(null);
  const [contratoFile, setContratoFile] = useState(null);
  const [activando, setActivando] = useState(false);

  const loadInquilinos = async () => {
    try {
      const vincData = await getVinculacionesByArrendador(currentUser.uid);
      const unicos = [];
      for (const v of vincData) {
        let cedula = v.inquilino_cedula || '';
        if (v.uid_inquilino) {
          const userSnap = await getDoc(doc(db, 'users', v.uid_inquilino));
          if (userSnap.exists()) {
            cedula = userSnap.data().cedula_mascarada || cedula;
          }
        }
        unicos.push({
          id: v.id,
          uid_inquilino: v.uid_inquilino || '',
          hash_cedula_inquilino: v.hash_cedula_inquilino,
          inquilino_nombre: v.nombre_inquilino || '',
          inquilino_cedula: cedula,
          contratoActivo: v.contrato_activo || false,
          contrato_url: v.contrato_url || null,
          monto_arriendo_mensual: v.monto_arriendo_mensual || 0,
          dia_corte: v.dia_corte || 15,
          origen: 'vinculacion',
          vinculacionId: v.id,
          estadoInvitacion: v.contrato_activo ? 'activo' : 'pendiente',
        });
      }
      setInquilinos(unicos);
    } catch {
      setError('Error al cargar inquilinos');
    }
  };

  useEffect(() => {
    loadInquilinos().finally(() => setLoading(false));
  }, [currentUser]);

  const loadPagosYResumen = async (inq) => {
    if (!inq.hash_cedula_inquilino || !inq.vinculacionId) return;
    setLoadingResumen(true);
    setLoadingPagos(true);
    try {
      const data = await getPagosByVinculacion(inq.vinculacionId);
      setPagos(data);
      const vincSnap = await getDoc(doc(db, 'vinculaciones', inq.vinculacionId));
      const monto = vincSnap.exists() ? (vincSnap.data().monto_arriendo_mensual || 0) : 0;
      setMontoMensual(monto);
      setMontoEdit(String(monto));
      const corte = vincSnap.exists() ? (vincSnap.data().dia_corte || 15) : 15;
      setDiaCorte(corte);
      setDiaCorteEdit(String(corte));
      const resumen = getResumenPagos(data, monto, vincSnap.data().fecha_activacion);
      setResumenPagos(resumen);
    } catch {
      setPagos([]);
      setResumenPagos([]);
    } finally {
      setLoadingPagos(false);
      setLoadingResumen(false);
    }
  };

  const selectInquilino = (inq) => {
    setSelectedInquilino(inq);
    setEditandoMonto(false);
    loadPagosYResumen(inq);
  };

  const handleUpdateMonto = async () => {
    const val = Number(montoEdit);
    if (val <= 0) { setError('Ingresa un monto válido'); return; }
    setError('');
    try {
      await updateMontoArriendo(selectedInquilino.vinculacionId, val);
      setMontoMensual(val);
      setEditandoMonto(false);
      const resumen = getResumenPagos(pagos, val, null);
      setResumenPagos(resumen);
    } catch (err) {
      setError(err.message || 'Error al actualizar monto');
    }
  };

  const handleUpdateDiaCorte = async () => {
    const val = Number(diaCorteEdit);
    if (val < 1 || val > 28) { setError('El día de corte debe estar entre 1 y 28'); return; }
    setError('');
    try {
      await updateDiaCorte(selectedInquilino.vinculacionId, val);
      setDiaCorte(val);
      setEditandoCorte(false);
    } catch (err) {
      setError(err.message || 'Error al actualizar día de corte');
    }
  };

  const handleCalificarClick = async (hash) => {
    setCalificarHash(hash);
    setCalificarExitoso(false);
    try {
      const existing = await getCalificacionByUidAndHash(currentUser.uid, hash);
      setDocumentoRequerido(!existing);
    } catch {
      setDocumentoRequerido(true);
    }
    setShowCalificarModal(true);
  };

  const handleCalificarSubmit = async (values) => {
    setError('');
    try {
      let pruebaUrl = '';
      if (values.prueba) {
        pruebaUrl = await uploadToCloudinary(values.prueba, 'inquilinoverificado');
      }
      await saveCalificacion({
        hash_cedula_inquilino: calificarHash,
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
      });
      setCalificarExitoso(true);
      setShowCalificarModal(false);
    } catch (err) {
      setError(err.message || 'Error al calificar');
    }
  };

  const handleAddPago = async (e) => {
    e.preventDefault();
    if (!pagoForm.monto || !pagoForm.concepto || !pagoForm.fecha_pago) {
      setError('Monto, concepto y fecha son obligatorios');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createPago({
        uid_arrendador: currentUser.uid,
        hash_cedula_inquilino: selectedInquilino.hash_cedula_inquilino,
        vinculacion_id: selectedInquilino.vinculacionId,
        nombre_inquilino: selectedInquilino.inquilino_nombre,
        telefono_inquilino: '',
        monto: pagoForm.monto,
        concepto: pagoForm.concepto,
        mes: pagoForm.mes,
        anio: pagoForm.anio,
        fecha_pago: pagoForm.fecha_pago,
        nota: pagoForm.nota,
      });
      setShowAddModal(false);
      setPagoForm({ monto: '', concepto: '', fecha_pago: '', nota: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
      await loadPagosYResumen(selectedInquilino);
    } catch (err) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviarWhatsApp = async (pago) => {
    const texto = encodeURIComponent(
      `Hola ${selectedInquilino.inquilino_nombre || 'inquilino'},\n\n` +
      `Te notifico el registro de un pago:\n\n` +
      `Concepto: ${pago.concepto}\n` +
      `Monto: $${Number(pago.monto).toFixed(2)}\n` +
      `Fecha de pago: ${pago.fecha_pago}\n` +
      `${pago.nota ? 'Nota: ' + pago.nota + '\n' : ''}\n` +
      `GoodRenter - Registro de pagos.`
    );
    window.open(`https://wa.me/${pago.telefono_inquilino.replace(/[^0-9]/g, '')}?text=${texto}`, '_blank');
    try {
      await marcarPagoEnviado(pago.id);
      await loadPagosYResumen(selectedInquilino);
    } catch {}
  };

  const handleActivar = async () => {
    if (!contratoFile || !activandoId) return;
    setActivando(true);
    setError('');
    try {
      const contratoUrl = await uploadToCloudinary(contratoFile, 'inquilinoverificado');
      await activarVinculacion(activandoId, contratoUrl);
      setShowActivarModal(false);
      setContratoFile(null);
      setActivandoId(null);
      await loadInquilinos();
    } catch (err) {
      setError(err.message || 'Error al activar inquilino');
    } finally {
      setActivando(false);
    }
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
      {calificarExitoso && <Alert variant="success" dismissible onClose={() => setCalificarExitoso(false)}><FaCheckCircle className="me-2" />Calificación guardada exitosamente</Alert>}

      <div className="d-flex align-items-center mb-3">
        <Link to="/dashboard/arrendador" className="btn btn-outline-secondary btn-sm me-3">
          <FaArrowLeft className="me-1" /> Volver
        </Link>
        <h4 className="mb-0"><FaUsers className="me-2 text-primary" />Gestión de Inquilinos</h4>
      </div>

      <Row className="g-3">
        <Col md={4}>
          <Card className="app-card">
            <Card.Body className="p-3">
              <h6 className="mb-3">Inquilinos</h6>
              {inquilinos.length === 0 ? (
                <p className="text-muted small mb-0">Invita a un inquilino desde la búsqueda. Cuando el inquilino acepte tu invitación, aparecerá aquí.</p>
              ) : (
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {inquilinos.map((inq) => (
                    <div
                      key={inq.id}
                      className={`border rounded p-2 mb-2 ${selectedInquilino?.hash_cedula_inquilino === inq.hash_cedula_inquilino ? 'border-primary bg-light' : ''}`}
                      onClick={() => selectInquilino(inq)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <small className="fw-semibold">{inq.inquilino_nombre || 'Inquilino'}</small>
                          <small className="text-muted d-block"><FaIdCard className="me-1" />{inq.inquilino_cedula || 'N/D'}</small>
                        </div>
                        {inq.estadoInvitacion === 'pending' ? (
                          <Badge bg="warning" text="dark" className="flex-shrink-0">Pendiente</Badge>
                        ) : (
                          <Badge bg={inq.contratoActivo ? 'success' : 'secondary'} className="flex-shrink-0">
                            {inq.contratoActivo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          {selectedInquilino ? (
            <>
              <Card className="app-card mb-3">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">{selectedInquilino.inquilino_nombre || 'Inquilino'}</h6>
                      <small className="text-muted"><FaIdCard className="me-1" />{selectedInquilino.inquilino_cedula || 'N/D'}</small>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      {selectedInquilino.estadoInvitacion === 'pending' ? (
                        <Badge bg="warning" text="dark">Pendiente de aceptación</Badge>
                      ) : (
                        <>
                          <Badge bg={selectedInquilino.contratoActivo ? 'success' : 'secondary'}>
                            {selectedInquilino.contratoActivo ? <><FaCheckCircle className="me-1" />Activo</> : <><FaTimesCircle className="me-1" />Inactivo</>}
                          </Badge>
                          {!selectedInquilino.contratoActivo && (
                            <Button size="sm" variant="success" onClick={() => { setActivandoId(selectedInquilino.vinculacionId); setShowActivarModal(true); }} className="d-flex align-items-center gap-1">
                              <FaFileUpload /> Activar contrato
                            </Button>
                          )}
                        </>
                      )}
                      {selectedInquilino.contrato_url && (
                        <a href={selectedInquilino.contrato_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" download>
                          <FaDownload /> Contrato
                        </a>
                      )}
                      <Button size="sm" variant="outline-warning" onClick={() => handleCalificarClick(selectedInquilino.hash_cedula_inquilino)} className="d-flex align-items-center gap-1">
                        <FaStar /> Calificar
                      </Button>
                    </div>
                  </div>
                  {editandoMonto ? (
                    <InputGroup size="sm" className="mt-2" style={{ maxWidth: 280 }}>
                      <InputGroup.Text><FaDollarSign /></InputGroup.Text>
                      <Form.Control type="number" step="0.01" min="0" value={montoEdit} onChange={(e) => setMontoEdit(e.target.value)} placeholder="Monto mensual" />
                      <Button variant="success" onClick={handleUpdateMonto}>Guardar</Button>
                      <Button variant="outline-secondary" onClick={() => { setEditandoMonto(false); setMontoEdit(String(montoMensual)); }}>Cancelar</Button>
                    </InputGroup>
                  ) : (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="badge bg-info fs-6">
                        <FaDollarSign className="me-1" />Arriendo mensual: ${montoMensual > 0 ? Number(montoMensual).toFixed(2) : '0.00'}
                      </span>
                      <Button size="sm" variant="outline-primary" onClick={() => setEditandoMonto(true)}><FaEdit /></Button>
                    </div>
                  )}
                  <div className="mt-2 d-flex align-items-center gap-2">
                    {editandoCorte ? (
                      <InputGroup size="sm" style={{ maxWidth: 240 }}>
                        <InputGroup.Text>Día de corte</InputGroup.Text>
                        <Form.Control type="number" min={1} max={28} value={diaCorteEdit} onChange={(e) => setDiaCorteEdit(e.target.value)} />
                        <Button variant="success" onClick={handleUpdateDiaCorte}>Guardar</Button>
                        <Button variant="outline-secondary" onClick={() => { setEditandoCorte(false); setDiaCorteEdit(String(diaCorte)); }}>Cancelar</Button>
                      </InputGroup>
                    ) : (
                      <>
                        <span className="badge bg-secondary fs-6">Día de corte: {diaCorte}</span>
                        <Button size="sm" variant="outline-secondary" onClick={() => setEditandoCorte(true)}><FaEdit /></Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {selectedInquilino.estadoInvitacion !== 'pending' && (
                <>
                  {loadingResumen ? (
                    <div className="text-center py-3"><Spinner animation="border" /></div>
                  ) : resumenPagos.length > 0 && montoMensual > 0 ? (
                    <Card className="app-card mb-3">
                      <Card.Body className="p-3">
                        <h6 className="mb-3"><FaCalendarAlt className="me-2 text-info" />Resumen mensual</h6>
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                          {resumenPagos.map((r, i) => (
                            <div key={i} className={`border rounded p-2 mb-2 ${r.saldo > 0 ? 'border-warning' : 'border-success'}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{r.label}</strong>
                                <Badge bg={r.saldo > 0 ? 'warning' : 'success'} text={r.saldo > 0 ? 'dark' : 'white'}>
                                  {r.saldo > 0 ? `Debe $${r.saldo.toFixed(2)}` : 'Pagado'}
                                </Badge>
                              </div>
                              <div className="d-flex gap-3 mt-1 small">
                                <span>Esperado: <strong>${r.esperado.toFixed(2)}</strong></span>
                                <span>Pagado: <strong className="text-success">${r.pagado.toFixed(2)}</strong></span>
                                <span>Saldo: <strong className={r.saldo > 0 ? 'text-danger' : 'text-success'}>${r.saldo.toFixed(2)}</strong></span>
                              </div>
                              {r.pagos.length > 0 && (
                                <div className="mt-1">
                                  {r.pagos.map((p) => (
                                    <small key={p.id} className="d-block text-muted">
                                      <FaMoneyBillWave className="me-1 text-success" />${Number(p.monto).toFixed(2)} - {p.concepto} ({p.fecha_pago})
                                    </small>
                                  ))}
                                </div>
                              )}
                              <Button size="sm" variant="outline-primary" className="mt-1" onClick={() => {
                                setPagoForm((pf) => ({ ...pf, mes: r.mes, anio: r.anio, concepto: `Abono ${r.label}` }));
                                setShowAddModal(true);
                              }}><FaPlus className="me-1" />Abono</Button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 p-2 bg-light rounded">
                          <strong>Deuda total acumulada: </strong>
                          <span className={resumenPagos[resumenPagos.length - 1]?.saldo > 0 ? 'text-danger' : 'text-success'}>
                            ${resumenPagos[resumenPagos.length - 1]?.saldo.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  ) : (
                    <Card className="app-card mb-3">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0"><FaHistory className="me-2 text-info" />Historial de pagos</h6>
                          <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)} className="d-flex align-items-center gap-1">
                            <FaPlus /> Registrar pago
                          </Button>
                        </div>
                        {loadingPagos ? (
                          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                        ) : pagos.length === 0 ? (
                          <Alert variant="info" className="mb-0 py-2 small">No hay pagos registrados para este inquilino.</Alert>
                        ) : (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {pagos.map((p) => (
                            <div key={p.id} className="border rounded p-2 mb-2">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong className="text-success">${Number(p.monto).toFixed(2)}</strong>
                                  <small className="text-muted d-block">{p.concepto}</small>
                                  {p.mes && p.anio && <small className="text-muted d-block">Período: {p.mes}/{p.anio}</small>}
                                  <small className="text-muted d-block"><FaCalendarAlt className="me-1" />{p.fecha_pago}</small>
                                  {p.nota && <small className="text-muted d-block">Nota: {p.nota}</small>}
                                </div>
                                <div className="d-flex flex-column align-items-end gap-1">
                                  <Badge bg={p.enviado_whatsapp ? 'success' : 'secondary'}>{p.enviado_whatsapp ? 'Enviado' : 'Pendiente'}</Badge>
                                  {!p.enviado_whatsapp && p.telefono_inquilino && (
                                    <Button size="sm" variant="success" onClick={() => handleEnviarWhatsApp(p)} className="d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                                      <FaWhatsapp /> WhatsApp
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      </Card.Body>
                    </Card>
                  )}
                </>
              )}
            </>
          ) : (
            <Card className="app-card">
              <Card.Body className="p-4 text-center">
                <FaUsers size={48} className="text-muted mb-3" />
                <p className="text-muted">Selecciona un inquilino de la lista para ver su historial de pagos.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setPagoForm({ monto: '', concepto: '', fecha_pago: '', nota: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear() }); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registrar abono / pago</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPago}>
          <Modal.Body>
            <Row className="g-2 mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Mes <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={pagoForm.mes} onChange={(e) => setPagoForm((p) => ({ ...p, mes: Number(e.target.value) }))}>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((n, i) => (
                      <option key={i + 1} value={i + 1}>{n}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Año <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min={2020} max={2099} value={pagoForm.anio} onChange={(e) => setPagoForm((p) => ({ ...p, anio: Number(e.target.value) }))} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Monto <span className="text-danger">*</span></Form.Label>
              <Form.Control type="number" step="0.01" min="0" value={pagoForm.monto} onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))} placeholder="0.00" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Concepto <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" value={pagoForm.concepto} onChange={(e) => setPagoForm((p) => ({ ...p, concepto: e.target.value }))} placeholder="Ej: Abono arriendo julio" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de pago <span className="text-danger">*</span></Form.Label>
              <Form.Control type="date" value={pagoForm.fecha_pago} onChange={(e) => setPagoForm((p) => ({ ...p, fecha_pago: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nota (opcional)</Form.Label>
              <Form.Control as="textarea" rows={2} value={pagoForm.nota} onChange={(e) => setPagoForm((p) => ({ ...p, nota: e.target.value }))} placeholder="Nota adicional para el inquilino..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setPagoForm({ monto: '', concepto: '', fecha_pago: '', nota: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear() }); }}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : <FaMoneyBillWave className="me-1" />} Registrar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showActivarModal} onHide={() => { setShowActivarModal(false); setContratoFile(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Activar contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Sube el documento del contrato firmado para activar al inquilino.</p>
          <Form.Group className="mb-3">
            <Form.Label>Documento del contrato <span className="text-danger">*</span></Form.Label>
            <Form.Control type="file" accept=".pdf,.jpg,.jpeg" onChange={(e) => setContratoFile(e.target.files[0] || null)} />
            <Form.Text className="text-muted">PDF o JPG. Se aloja en Cloudinary.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowActivarModal(false); setContratoFile(null); }}>Cancelar</Button>
          <Button variant="success" onClick={handleActivar} disabled={activando || !contratoFile}>
            {activando ? <Spinner size="sm" /> : <FaFileUpload className="me-1" />} Activar inquilino
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCalificarModal} onHide={() => setShowCalificarModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Calificar inquilino</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RatingForm onSubmit={handleCalificarSubmit} documentoRequerido={documentoRequerido} submitLabel="Guardar calificación" />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default GestionInquilinos;