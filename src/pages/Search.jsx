import { useState } from 'react';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaShieldAlt } from 'react-icons/fa';
import { Formik, Field, ErrorMessage } from 'formik';
import { cedulaSchema } from '../utils/validators';
import { searchByCedula } from '../services/firestoreService';
import SearchResult from '../components/SearchResult';

const Search = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cedulaBuscada, setCedulaBuscada] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await searchByCedula(values.cedula);
      setResult(res);
      setCedulaBuscada(values.cedula);
    } catch {
      setError('Error al realizar la busqueda');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container className="page-container">
      <h3 className="mb-2"><FaSearch className="me-2 text-primary" />Buscar Inquilino</h3>
      <p className="text-muted mb-4">Ingrese la cedula del inquilino para ver su promedio de calificaciones</p>

      <Card className="app-card mb-3">
        <Card.Body className="p-4">
          <Formik
            initialValues={{ cedula: '' }}
            validationSchema={cedulaSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting }) => (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Cedula</Form.Label>
                  <div className="input-group">
                    <Field name="cedula">
                      {({ field }) => (
                        <Form.Control
                          {...field}
                          type="text"
                          maxLength={10}
                          placeholder="10 digitos sin guiones"
                          isInvalid={!!error}
                        />
                      )}
                    </Field>
                    <Button type="submit" variant="primary" disabled={isSubmitting || loading}>
                      {loading ? <Spinner size="sm" /> : <FaSearch />}
                    </Button>
                  </div>
                  <ErrorMessage name="cedula" component="div" className="text-danger small mt-1" />
                </Form.Group>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Buscando...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {result && !loading && <SearchResult result={result} cedula={cedulaBuscada} />}

      <div className="text-center mt-4">
        <small className="text-muted">
          <FaShieldAlt className="me-1" /> Solo se muestran datos anonimos, cumpliendo con la LOPDP
        </small>
      </div>
    </Container>
  );
};

export default Search;
