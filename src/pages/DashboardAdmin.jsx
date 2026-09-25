import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaShieldAlt, FaStar, FaFlag, FaCheck, FaTrash, FaUser, FaFileContract } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getDisputas, resolverDisputa, getUserByUid } from '../services/firestoreService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const DashboardAdmin = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalCalificaciones: 0, disputasPendientes: 0 });
  const [disputasData, setDisputasData] = useState([]);
  const [resolving, setResolving] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [usersSnap, califSnap, disputas] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'calificaciones')),
        getDisputas(),
      ]);

      setStats({
        totalUsers: usersSnap.size,
        totalCalificaciones: califSnap.size,
        disputasPendientes: disputas.length,
      });

      const enriched = await Promise.all(
        disputas.map(async (d) => {
          let arrendador = null;
          let inquilino = null;
          try {
            if (d.uid_arrendador) {
              arrendador = await getUserByUid(d.uid_arrendador);
            }
            if (d.hash_cedula_inquilino) {
              const q = query(collection(db, 'users'), where('hash_cedula', '==', d.hash_cedula_inquilino));
              const snap = await getDocs(q);
              if (!snap.empty) inquilino = { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          } catch {
            // user lookup failed
          }
          return { ...d, arrendador, inquilino };
        })
      );

      setDisputasData(enriched);
    } catch {
      setError('Error al cargar datos del panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolver = async (calificacionId, accion) => {
    setResolving(calificacionId);
    try {
      await resolverDisputa(calificacionId, accion);
      await loadData();
    } catch {
      setError('Error al resolver la disputa');
    } finally {
      setResolving(null);
    }
  };

  const getEstrellas = (valor) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(<FaStar key={i} className={i <= Math.round(valor) ? 'text-warning' : 'text-secondary'} size={12} />);
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

      <div className="d-flex align-items-center mb-4">
        <FaShieldAlt className="text-primary me-2" size={28} />
        <h3 className="mb-0">Panel de Administracion</h3>
      </div>

      <Row className="mb-4 g-3">
        <Col sm={6} lg={4}>
          <Card className="app-card mb-3">
            <Card.Body className="p-4 text-center">
              <FaUser className="text-primary mb-2" size={24} />
              <h2 className="mb-0">{stats.totalUsers}</h2>
              <small className="text-muted">Usuarios Registrados</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={4}>
          <Card className="app-card mb-3">
            <Card.Body className="p-4 text-center">
              <FaFileContract className="text-success mb-2" size={24} />
              <h2 className="mb-0">{stats.totalCalificaciones}</h2>
              <small className="text-muted">Calificaciones Totales</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={4}>
          <Card className="app-card mb-3">
            <Card.Body className="p-4 text-center">
              <FaFlag className={stats.disputasPendientes > 0 ? 'text-danger mb-2' : 'text-muted mb-2'} size={24} />
              <h2 className="mb-0">{stats.disputasPendientes}</h2>
              <small className="text-muted">Disputas Pendientes</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <h5 className="mb-3"><FaFlag className="me-2 text-danger" />Disputas Pendientes</h5>
          {disputasData.length === 0 ? (
            <Alert variant="success" className="mb-0">No hay disputas pendientes por revisar.</Alert>
          ) : (
            disputasData.map((d) => (
              <Card key={d.id} className="mb-3 border">
                <Card.Body>
                  <Row className="mb-2">
                    <Col xs={12} md={6}>
                      <small className="text-muted d-block">Arrendador:</small>
                      <strong>{d.arrendador?.nombre || 'Desconocido'}</strong>
                      {d.arrendador?.email && <span className="text-muted small ms-2">({d.arrendador.email})</span>}
                    </Col>
                    <Col xs={12} md={6}>
                      <small className="text-muted d-block">Inquilino:</small>
                      <strong>{d.inquilino?.nombre || 'Desconocido'}</strong>
                    </Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    <Col xs={4}>
                      <small className="text-muted d-block">Pago</small>
                      <div>{getEstrellas(d.estrellas_pago)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{d.estrellas_pago}/5</Badge>
                    </Col>
                    <Col xs={4}>
                      <small className="text-muted d-block">Cuidado</small>
                      <div>{getEstrellas(d.estrellas_cuidado)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{d.estrellas_cuidado}/5</Badge>
                    </Col>
                    <Col xs={4}>
                      <small className="text-muted d-block">Comunicacion</small>
                      <div>{getEstrellas(d.estrellas_comunicacion)}</div>
                      <Badge bg="warning" text="dark" className="mt-1">{d.estrellas_comunicacion}/5</Badge>
                    </Col>
                  </Row>

                  {d.comentario && (
                    <div className="mb-2">
                      <small className="text-muted d-block">Comentario:</small>
                      <p className="small mb-0">{d.comentario}</p>
                    </div>
                  )}

                  {d.motivo_bloqueo && (
                    <div className="bg-light p-2 rounded mb-2">
                      <small className="text-danger fw-semibold d-block">Motivo de bloqueo:</small>
                      <p className="small mb-0">{d.motivo_bloqueo}</p>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleResolver(d.id, 'mantener')}
                      disabled={resolving === d.id}
                    >
                      {resolving === d.id ? <Spinner size="sm" /> : <FaCheck className="me-1" />}Mantener
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleResolver(d.id, 'eliminar')}
                      disabled={resolving === d.id}
                    >
                      {resolving === d.id ? <Spinner size="sm" /> : <FaTrash className="me-1" />}Eliminar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DashboardAdmin;
