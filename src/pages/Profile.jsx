import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaSave, FaArrowLeft, FaEdit, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { hashCedula, maskCedula } from '../utils/hash';
import { hasVinculaciones } from '../services/firestoreService';

const Profile = () => {
  const { userData, refreshUserData } = useAuth();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vinculado, setVinculado] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (userData) {
      setNombre(userData.nombre || '');
      setTelefono(userData.telefono || '');
      setCedula('');
      if (userData.hash_cedula) {
        hasVinculaciones(userData.hash_cedula)
          .then(setVinculado)
          .catch(() => setVinculado(true))
          .finally(() => setChecking(false));
      } else {
        setVinculado(false);
        setChecking(false);
      }
    }
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (cedula && !/^\d{10}$/.test(cedula)) {
      setError('La cédula debe tener exactamente 10 dígitos');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updates = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      };
      if (cedula && !vinculado) {
        updates.hash_cedula = hashCedula(cedula);
        updates.cedula_mascarada = maskCedula(cedula);
      }
      await updateDoc(doc(db, 'users', userData.uid), updates);
      await refreshUserData();
      setCedula('');
      setSuccess('Datos actualizados correctamente');
    } catch {
      setError('Error al actualizar datos');
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="page-container">
      <Link to="/dashboard" className="btn btn-outline-secondary btn-app-sm mb-3">
        <FaArrowLeft className="me-1" /> Volver
      </Link>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="initials-badge" style={{ width: 48, height: 48, fontSize: '1rem' }}>
              {userData.nombre ? userData.nombre.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h4 className="mb-1">Mi Perfil</h4>
              <small className="text-muted">{userData.email}</small>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {checking ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : vinculado ? (
            <Alert variant="warning" className="d-flex align-items-center gap-2">
              <FaLock className="flex-shrink-0" />
              <small>La cédula no se puede modificar porque ya tiene calificaciones o links generados asociados.</small>
            </Alert>
          ) : (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <FaEdit className="flex-shrink-0" />
              <small>Puedes editar tu cédula, aún no tiene calificaciones ni links asociados.</small>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Su nombre"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Número de teléfono"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Cédula</Form.Label>
              {vinculado ? (
                <Form.Control
                  type="text"
                  value={userData.cedula_mascarada || ''}
                  disabled
                />
              ) : (
                <Form.Control
                  type="text"
                  maxLength={10}
                  value={cedula || userData.cedula_mascarada || ''}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 dígitos sin guiones"
                  isInvalid={!!cedula && !/^\d{10}$/.test(cedula)}
                />
              )}
              {!vinculado && (
                <Form.Text className="text-muted">
                  {cedula ? 'Ingresa los 10 dígitos de tu cédula para actualizarla' : 'Deja en blanco para mantener la cédula actual'}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Rol</Form.Label>
              <Form.Control
                type="text"
                value={userData.rol === 'arrendador' ? 'Arrendador' : userData.rol === 'inquilino' ? 'Inquilino' : userData.rol || ''}
                disabled
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={saving} className="btn-app">
                {saving ? <><Spinner size="sm" className="me-2" />Guardando...</> : <><FaSave className="me-2" />Guardar cambios</>}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;