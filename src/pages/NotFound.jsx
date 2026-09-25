import { Link } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <Container className="page-container">
      <Card className="app-card mb-3">
        <Card.Body className="p-5">
          <h1 className="display-1 text-muted fw-bold">404</h1>
          <h4 className="mb-3">Pagina no encontrada</h4>
          <p className="text-muted mb-4">La pagina que buscas no existe o ha sido movida.</p>
          <Button as={Link} to="/" variant="primary">
            <FaHome className="me-1" /> Volver al inicio
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotFound;
