import { useState, useEffect } from 'react';
import { Container, Card, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaDollarSign, FaCalendarAlt, FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVinculacionesByInquilino, getPagosByVinculacion, getResumenPagos } from '../services/firestoreService';

const MisPagos = () => {
  const { currentUser } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState([]);
  const [montoMensual, setMontoMensual] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const vincs = await getVinculacionesByInquilino(currentUser.uid);
        if (vincs.length === 0) { setCargando(false); return; }
        const v = vincs[0];
        setMontoMensual(v.monto_arriendo_mensual || 0);
        if (v.monto_arriendo_mensual && v.fecha_activacion) {
          const pagos = await getPagosByVinculacion(v.id);
          const r = getResumenPagos(pagos, v.monto_arriendo_mensual, v.fecha_activacion);
          setResumen(r);
        }
      } catch {
        setError('Error al cargar información de pagos');
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

  const deudaTotal = resumen.length > 0 ? resumen[resumen.length - 1].saldo : 0;

  return (
    <Container className="page-container" style={{ maxWidth: 600 }}>
      <div className="d-flex align-items-center mb-3">
        <Link to="/dashboard/inquilino" className="btn btn-outline-secondary btn-sm me-3">
          <FaArrowLeft className="me-1" /> Volver
        </Link>
        <h5 className="mb-0"><FaDollarSign className="me-2 text-primary" />Mis Pagos</h5>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {montoMensual > 0 ? (
        <>
          <Card className="app-card mb-3">
            <Card.Body className="p-3 text-center">
              <small className="text-muted">Arriendo mensual</small>
              <h3 className="mb-0">${Number(montoMensual).toFixed(2)}</h3>
            </Card.Body>
          </Card>

          {resumen.length > 0 && (
            <Card className="app-card mb-3">
              <Card.Body className="p-3">
                <h6 className="mb-3"><FaCalendarAlt className="me-2 text-info" />Estado por mes</h6>
                {resumen.map((r, i) => (
                  <div key={i} className={`border rounded p-2 mb-2 ${r.saldo > 0 ? 'border-warning' : 'border-success'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>{r.label}</strong>
                      <Badge bg={r.saldo > 0 ? 'warning' : 'success'} text={r.saldo > 0 ? 'dark' : 'white'}>
                        {r.saldo > 0 ? `Pendiente $${r.saldo.toFixed(2)}` : 'Al día'}
                      </Badge>
                    </div>
                    <div className="d-flex gap-3 mt-1 small">
                      <span>Esperado: <strong>${r.esperado.toFixed(2)}</strong></span>
                      <span>Pagado: <strong className="text-success">${r.pagado.toFixed(2)}</strong></span>
                    </div>
                    {r.pagos.map((p) => (
                      <small key={p.id} className="d-block text-muted mt-1">
                        <FaMoneyBillWave className="me-1 text-success" />${Number(p.monto).toFixed(2)} - {p.fecha_pago}
                      </small>
                    ))}
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          <Card className={`app-card ${deudaTotal > 0 ? 'border-danger' : 'border-success'}`}>
            <Card.Body className="p-3 text-center">
              <small className="text-muted">Deuda total acumulada</small>
              <h3 className={`mb-0 ${deudaTotal > 0 ? 'text-danger' : 'text-success'}`}>
                ${deudaTotal.toFixed(2)}
              </h3>
              {deudaTotal > 0 ? (
                <small className="text-danger">Ponte al día con tus pagos</small>
              ) : (
                <small className="text-success">¡Estás al día!</small>
              )}
            </Card.Body>
          </Card>
        </>
      ) : (
        <Card className="app-card">
          <Card.Body className="p-4 text-center">
            <FaDollarSign size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">Tu arrendador aún no ha configurado el monto de arriendo mensual.</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MisPagos;
