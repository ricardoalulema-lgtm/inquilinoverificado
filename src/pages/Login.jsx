import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import * as yup from 'yup';
import { Card, Container, Alert, Button } from 'react-bootstrap';
import { loginWithEmail, resetPassword } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().required('Contraseña requerida'),
});

const Login = () => {
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const getRoleDashboard = (rol) => {
    if (rol === 'inquilino') return '/dashboard/inquilino';
    if (rol === 'arrendador') return '/dashboard/arrendador';
    if (rol === 'admin') return '/dashboard/admin';
    return '/dashboard';
  };

  const handleResetPassword = async () => {
    const email = prompt('Ingresa tu email para restablecer la contraseña:');
    if (!email) return;
    setError('');
    setResetSent(false);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/invalid-email': 'Email inválido',
      };
      setError(messages[err.code] || err.message || 'Error al enviar correo');
    }
  };

  const handleEmailLogin = async (values, { setSubmitting }) => {
    setError('');
    try {
      const result = await loginWithEmail(values.email, values.password);
      const docSnap = await getDoc(doc(db, 'users', result.user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data();
        navigate(getRoleDashboard(userData.rol));
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      };
      setError(messages[err.code] || err.message || 'Error al iniciar sesión');
      setSubmitting(false);
    }
  };

  return (
    <Container className="page-container">
      <Card className="mx-auto shadow-sm" style={{ maxWidth: 440 }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-1">GoodRenter</h2>
          <p className="text-center text-muted mb-4">Inicia sesión</p>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {resetSent && <Alert variant="success">Correo de restablecimiento enviado. Revisa tu bandeja de entrada.</Alert>}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleEmailLogin}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email</label>
                  <Field name="email" id="email" type="email" className="form-control" placeholder="correo@ejemplo.com" />
                  <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <Field name="password" id="password" type="password" className="form-control" placeholder="••••••" />
                  <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
                </div>
                <Button type="submit" variant="primary" className="w-100 mb-2" disabled={isSubmitting}>
                  {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-2">
            <Button variant="link" className="text-decoration-none p-0" onClick={handleResetPassword}>
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
          <p className="text-center mt-3 mb-0">
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
