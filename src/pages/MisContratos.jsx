import { useState, useEffect } from 'react';
import { Container, Card, Spinner, Badge, Alert, Button } from 'react-bootstrap';
import { FaDollarSign, FaCalendarAlt, FaMoneyBillWave, FaDownload, FaCheckCircle, FaTimesCircle, FaUser, FaArrowLeft, FaIdCard, FaFileContract } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVinculacionesByInquilino, getPagosByVinculacion, getResumenPagos, getPromedioByHash } from '../services/firestoreService';
import { doc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const MisContratos = () => {
  const { currentUser } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [contratos, setContratos] = useState([]);
  const [promedio, setPromedio] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let vincs = [];
        try {
          vincs = await getVinculacionesByInquilino(currentUser.uid);
        } catch {}

        if (vincs.length === 0) {
          try {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) {
              const hash = userSnap.data().hash_cedula;
              if (hash) {
                const q = query(collection(db, 'vinculaciones'), where('hash_cedula_inquilino', '==', hash));
                const snap = await getDocs(q);
                vincs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              }
            }
          } catch {}
        }
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const hash = userSnap.data().hash_cedula;
          if (hash) {
            const prom = await getPromedioByHash(hash);
            if (prom) setPromedio(prom);
          }
        }
        const conDatos = [];
        for (const v of vincs) {
          let arrendadorNombre = 'Arrendador';
          let arrendadorCedula = '';
          if (v.uid_arrendador) {
            const snap = await getDoc(doc(db, 'users', v.uid_arrendador));
            if (snap.exists()) {
              arrendadorNombre = snap.data().nombre || arrendadorNombre;
              arrendadorCedula = snap.data().cedula_mascarada || '';
            }
          }
          const pagos = await getPagosByVinculacion(v.id);
          const resumen = v.monto_arriendo_mensual && v.fecha_activacion
            ? getResumenPagos(pagos, v.monto_arriendo_mensual, v.fecha_activacion)
            : [];
          conDatos.push({
            id: v.id,
            arrendadorNombre,
            arrendadorCedula,
            montoMensual: v.monto_arriendo_mensual || 0,
            diaCorte: v.dia_corte || 15,
            contratoActivo: v.contrato_activo || false,
            contratoUrl: v.contrato_url || null,
            fechaActivacion: v.fecha_activacion,
            pagos,
            resumen,
          });
        }
        setContratos(conDatos);
      } catch {
        setError('Error al cargar tus contratos');
      } finally {
        setCargando(false);
      }
    })();
  }, [currentUser]);

  if (cargando) {
    return (
      <Container className="page-container">
        <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>
      </Container>
    );
  }

  return (
    <Container className="page-container" style={{ maxWidth: 700 }}>
      <div className="d-flex align-items-center mb-3">
        <Link to="/dashboard/inquilino" className="btn btn-outline-secondary btn-sm me-3">
          <FaArrowLeft className="me-1" /> Volver
        </Link>
        <h5 className="mb-0"><FaFileContract className="me-2 text-primary" />Mis Contratos</h5>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {contratos.length === 0 ? (
        <Card className="app-card">
          <Card.Body className="p-4 text-center">
            <FaFileContract size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No tienes contratos activos aún. Cuando un arrendador te vincule, aparecerán aquí.</p>
          </Card.Body>
        </Card>
      ) : (
        contratos.map((c) => {
          const deuda = c.resumen.length > 0 ? c.resumen[c.resumen.length - 1].saldo : 0;
          return (
            <Card key={c.id} className={`app-card mb-3 ${c.contratoActivo ? '' : 'border-secondary'}`}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1"><FaUser className="me-1 text-primary" />{c.arrendadorNombre}</h6>
                    {c.arrendadorCedula && (
                      <small className="text-muted d-block"><FaIdCard className="me-1" />{c.arrendadorCedula}</small>
                    )}
                    {promedio && (
                      <small className="d-block mt-1">
                        <span className="text-warning">{'★'.repeat(Math.round(promedio.promedio_general || 0))}{'☆'.repeat(5 - Math.round(promedio.promedio_general || 0))}</span>
                        <span className="text-muted ms-1">({promedio.total_calificaciones || 0})</span>
                      </small>
                    )}
                  </div>
                  <Badge bg={c.contratoActivo ? 'success' : 'secondary'}>
                    {c.contratoActivo ? <><FaCheckCircle className="me-1" />Activo</> : <><FaTimesCircle className="me-1" />Inactivo</>}
                  </Badge>
                </div>

                <div className="d-flex gap-3 mb-2 small">
                  <span>Arriendo: <strong>${Number(c.montoMensual).toFixed(2)}</strong></span>
                  <span>Día de corte: <strong>{c.diaCorte}</strong></span>
                  <span>Deuda: <strong className={deuda > 0 ? 'text-danger' : 'text-success'}>${deuda.toFixed(2)}</strong></span>
                </div>

                {c.contratoUrl && (
                  <a href={c.contratoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 mb-2" download>
                    <FaDownload /> Contrato
                  </a>
                )}

                {c.resumen.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted fw-semibold"><FaCalendarAlt className="me-1" />Historial de pagos</small>
                    <div className="mt-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {c.resumen.map((r, i) => (
                        <div key={i} className={`border rounded p-2 mb-1 ${r.saldo > 0 ? 'border-warning' : 'border-success'}`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="fw-semibold">{r.label}</small>
                            <Badge bg={r.saldo > 0 ? 'warning' : 'success'} text={r.saldo > 0 ? 'dark' : 'white'} style={{ fontSize: 11 }}>
                              {r.saldo > 0 ? `Debe $${r.saldo.toFixed(2)}` : 'Pagado'}
                            </Badge>
                          </div>
                          <div className="d-flex gap-2 mt-1" style={{ fontSize: 12 }}>
                            <span>Pagado: <strong className="text-success">${r.pagado.toFixed(2)}</strong></span>
                            <span>Saldo: <strong className={r.saldo > 0 ? 'text-danger' : 'text-success'}>${r.saldo.toFixed(2)}</strong></span>
                          </div>
                          {r.pagos.map((p) => (
                            <small key={p.id} className="d-block text-muted" style={{ fontSize: 11 }}>
                              <FaMoneyBillWave className="me-1 text-success" />${Number(p.monto).toFixed(2)} - {p.fecha_pago} {p.concepto ? `(${p.concepto})` : ''}
                            </small>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!c.montoMensual && (
                  <Alert variant="info" className="mb-0 py-2 small">
                    El arrendador aún no ha configurado el monto de arriendo mensual.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          );
        })
      )}
    </Container>
  );
};

export default MisContratos;
