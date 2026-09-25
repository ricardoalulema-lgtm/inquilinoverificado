import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Card, Container, Alert, Button } from 'react-bootstrap';
import { registerSchema } from '../utils/validators';
import { registerWithEmail } from '../services/authService';
import { getInvitacionByToken, createVinculacion, deleteInvitacion } from '../services/firestoreService';
import { maskCedula } from '../utils/hash';
import LegalModal from '../components/LegalModal';
import { useBotProtection } from '../hooks/useBotProtection';

const Register = () => {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const esInvitacion = redirect.startsWith('/i/');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [legalModal, setLegalModal] = useState({ show: false, type: '' });
  const [codigoPais, setCodigoPais] = useState('+593');
  const navigate = useNavigate();
  const { honeypotRef, captchaA, captchaB, captchaValue, setCaptchaValue, validate } = useBotProtection();

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    if (!validate()) {
      setError('Error de validación. Intenta de nuevo.');
      setSubmitting(false);
      return;
    }
    try {
      const telefonoCompleto = `${codigoPais}${values.telefono}`;
      const result = await registerWithEmail(
        values.nombre,
        values.cedula,
        values.email,
        telefonoCompleto,
        values.password,
        values.rol
      );
      if (esInvitacion) {
        const token = redirect.replace('/i/', '');
        const inv = await getInvitacionByToken(token);
        if (inv && inv.estado === 'pending') {
          await createVinculacion({
            uid_arrendador: inv.uid_arrendador,
            uid_inquilino: result.user.uid,
            hash_cedula_inquilino: inv.hash_cedula_inquilino,
            nombre_inquilino: inv.nombre_inquilino || '',
            inquilino_cedula: maskCedula(values.cedula),
            telefono_inquilino: telefonoCompleto,
          });
          await deleteInvitacion(inv.id);
        }
      }
      navigate('/dashboard');
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'El email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      };
      setError(messages[err.code] || err.message || 'Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="page-container">
      <Card className="mx-auto shadow-sm" style={{ maxWidth: 480 }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Crear Cuenta</h2>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          <Formik
            initialValues={{
              nombre: '',
              cedula: '',
              email: '',
              telefono: '',
              password: '',
              confirmPassword: '',
              rol: 'inquilino',
              acceptTerms: false,
              acceptPrivacy: false,
            }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, setFieldValue }) => (
                <Form>
                  <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                    <label htmlFor="honeypot">No llenar</label>
                    <input id="honeypot" name="honeypot" type="text" ref={honeypotRef} tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className="mb-3">
                  <label className="form-label" htmlFor="nombre">Nombre completo</label>
                  <Field name="nombre" id="nombre" className="form-control" placeholder="Juan Pérez" />
                  <ErrorMessage name="nombre" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="cedula">Cédula</label>
                  <Field name="cedula" id="cedula" className="form-control" placeholder="10 dígitos" maxLength={10} />
                  <ErrorMessage name="cedula" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email</label>
                  <Field name="email" id="email" type="email" className="form-control" placeholder="correo@ejemplo.com" />
                  <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="telefono">Teléfono (WhatsApp)</label>
                  <div className="input-group">
                    <select className="form-select" style={{ maxWidth: 110 }} value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)}>
                      <option value="+593">🇪🇨 +593</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                    </select>
                    <Field name="telefono" id="telefono" className="form-control" placeholder="999999999" maxLength={15} />
                  </div>
                  <ErrorMessage name="telefono" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <div className="input-group">
                    <Field name="password" id="password" type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Mínimo 6 caracteres" />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <div className="input-group">
                    <Field name="confirmPassword" id="confirmPassword" type={showConfirm ? 'text' : 'password'} className="form-control" placeholder="Repite la contraseña" />
                    <Button variant="outline-secondary" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tipo de cuenta</label>
                  {esInvitacion ? (
                    <div className="mt-1">
                      <span className="badge bg-info text-dark">Inquilino (invitado)</span>
                    </div>
                  ) : (
                    <div className="d-flex gap-4 mt-1">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" id="rol-inquilino" checked={values.rol === 'inquilino'} onChange={() => setFieldValue('rol', 'inquilino')} />
                        <label className="form-check-label" htmlFor="rol-inquilino">Inquilino</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" id="rol-arrendador" checked={values.rol === 'arrendador'} onChange={() => setFieldValue('rol', 'arrendador')} />
                        <label className="form-check-label" htmlFor="rol-arrendador">Arrendador</label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="acceptTerms" checked={values.acceptTerms} onChange={() => setFieldValue('acceptTerms', !values.acceptTerms)} />
                    <label className="form-check-label" htmlFor="acceptTerms">
                      Acepto los{' '}
                      <span className="text-primary text-decoration-underline" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setLegalModal({ show: true, type: 'terms' }); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setLegalModal({ show: true, type: 'terms' }); } }}>
                        Términos y Condiciones
                      </span>
                    </label>
                  </div>
                  <ErrorMessage name="acceptTerms" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="acceptPrivacy" checked={values.acceptPrivacy} onChange={() => setFieldValue('acceptPrivacy', !values.acceptPrivacy)} />
                    <label className="form-check-label" htmlFor="acceptPrivacy">
                      Acepto el{' '}
                      <span className="text-primary text-decoration-underline" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setLegalModal({ show: true, type: 'privacy' }); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setLegalModal({ show: true, type: 'privacy' }); } }}>
                        Aviso de Privacidad
                      </span>
                    </label>
                  </div>
                  <ErrorMessage name="acceptPrivacy" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-4">
                  <label className="form-label">Verificación de seguridad</label>
                  <div className="input-group">
                    <span className="input-group-text">{captchaA} + {captchaB} = ?</span>
                    <input
                      type="number"
                      className="form-control"
                      value={captchaValue}
                      onChange={(e) => setCaptchaValue(e.target.value)}
                      placeholder="Resultado"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-100 mb-3" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </Button>

                <p className="text-center mb-0">
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>
      <LegalModal show={legalModal.show} type={legalModal.type} onHide={() => setLegalModal({ show: false, type: '' })} />
    </Container>
  );
};

export default Register;
