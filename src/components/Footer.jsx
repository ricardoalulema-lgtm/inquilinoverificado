import { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import LegalModal from './LegalModal';

const Footer = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('terms');

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
            <small>&copy; {new Date().getFullYear()} GoodRenter &mdash; Todos los derechos reservados.</small>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <button
              className="btn btn-link text-light text-decoration-none p-0 me-3"
              onClick={() => openModal('terms')}
            >
              <small>Términos y Condiciones</small>
            </button>
            <button
              className="btn btn-link text-light text-decoration-none p-0"
              onClick={() => openModal('privacy')}
            >
              <small>Aviso de Privacidad</small>
            </button>
          </Col>
        </Row>
      </Container>
      <LegalModal show={showModal} onHide={() => setShowModal(false)} type={modalType} />
    </footer>
  );
};

export default Footer;
