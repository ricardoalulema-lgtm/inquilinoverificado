import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaSearch, FaUserPlus, FaShieldAlt, FaCheckCircle, FaArrowRight, FaChartBar, FaHome, FaClipboardList, FaStar, FaQuoteRight } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero-section position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <div className="mb-4">
            <span className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-15 rounded-pill px-4 py-2 text-white mb-4" style={{ backdropFilter: 'blur(4px)', fontSize: '0.85rem' }}>
              <FaShieldAlt /> Confianza y privacidad para arrendadores e inquilinos
            </span>
          </div>
          <h1 className="display-3 fw-bold lh-1 mb-3">
            Tu historial<br />como inquilino,<br /><span style={{ color: '#facc15' }}>en un solo lugar</span>
          </h1>
          <p className="lead mb-4 mx-auto opacity-90" style={{ maxWidth: 520 }}>
            GoodRenter conecta arrendadores con referencias verificadas de inquilinos. Todo con total privacidad y cumplimiento LOPDP.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Button size="lg" variant="light" className="fw-bold px-4 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 14 }} onClick={() => navigate('/register?rol=arrendador')}>
              <FaSearch /> Buscar Inquilino
            </Button>
            <Button size="lg" variant="outline-light" className="fw-bold px-4 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 14 }} onClick={() => navigate('/register?rol=inquilino')}>
              <FaUserPlus /> Crear mi Perfil
            </Button>
          </div>
          <p className="mt-4 opacity-75 small">
            ⚡ Sin registro puedes consultar calificaciones
          </p>
        </Container>
      </section>

      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">¿Por qué GoodRenter?</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 480 }}>Una plataforma que protege a ambas partes con transparencia y seguridad de datos</p>
          </div>
          <Row className="g-4">
            <Col md={4}>
              <div className="app-card h-100 p-4 text-center" style={{ borderTop: '4px solid var(--primary)' }}>
                <div className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56 }}>
                  <FaSearch className="text-primary" size={22} />
                </div>
                <h5 className="fw-bold">Para Arrendadores</h5>
                <p className="text-muted small mb-3">
                  Busca inquilinos por cédula, revisa calificaciones reales de otros arrendadores y decide con confianza a quién alquilar tu propiedad.
                </p>
                <Button variant="link" className="text-decoration-none p-0 d-inline-flex align-items-center gap-1" onClick={() => navigate('/register?rol=arrendador')}>
                  Quiero buscar <FaArrowRight size={12} />
                </Button>
              </div>
            </Col>
            <Col md={4}>
              <div className="app-card h-100 p-4 text-center" style={{ borderTop: '4px solid var(--accent)' }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: 'rgba(234,179,8,0.1)' }}>
                  <FaStar className="text-warning" size={22} />
                </div>
                <h5 className="fw-bold">Para Inquilinos</h5>
                <p className="text-muted small mb-3">
                  Construye tu reputación como inquilino responsable. Comparte tu perfil verificado con futuros arrendadores y destaca entre otros postulantes.
                </p>
                <Button variant="link" className="text-decoration-none p-0 d-inline-flex align-items-center gap-1" onClick={() => navigate('/register?rol=inquilino')}>
                  Quiero crearlo <FaArrowRight size={12} />
                </Button>
              </div>
            </Col>
            <Col md={4}>
              <div className="app-card h-100 p-4 text-center" style={{ borderTop: '4px solid var(--success)' }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: 'rgba(22,163,74,0.1)' }}>
                  <FaShieldAlt className="text-success" size={22} />
                </div>
                <h5 className="fw-bold">Privacidad Garantizada</h5>
                <p className="text-muted small mb-3">
                  Cumplimiento total de la LOPDP. Tus datos viajan cifrados con hash. Nunca compartimos tu información sensible ni tu cédula real.
                </p>
                <Button variant="link" className="text-decoration-none p-0 d-inline-flex align-items-center gap-1">
                  Más información <FaArrowRight size={12} />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' }} className="py-5 text-white">
        <Container>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Confianza en cifras</h2>
            <p className="opacity-75">La comunidad GoodRenter crece cada día</p>
          </div>
          <Row className="g-4 text-center">
            <Col xs={4}>
              <div className="py-3 px-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <h2 className="fw-bold mb-0 display-5">500+</h2>
                <small className="opacity-75">Calificaciones</small>
              </div>
            </Col>
            <Col xs={4}>
              <div className="py-3 px-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <h2 className="fw-bold mb-0 display-5">100+</h2>
                <small className="opacity-75">Arrendadores</small>
              </div>
            </Col>
            <Col xs={4}>
              <div className="py-3 px-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <h2 className="fw-bold mb-0 display-5">50+</h2>
                <small className="opacity-75">Inquilinos</small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Cómo funciona</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 480 }}>En tres pasos simples puedes empezar a usar GoodRenter</p>
          </div>
          <Row className="g-4">
            <Col md={4}>
              <div className="text-center">
                <div className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3 position-relative" style={{ width: 80, height: 80 }}>
                  <FaClipboardList className="text-primary" size={28} />
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.7rem' }}>1</span>
                </div>
                <h5 className="fw-bold">Regístrate</h5>
                <p className="text-muted small">Crea tu cuenta como arrendador o inquilino en menos de 2 minutos.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3 position-relative" style={{ width: 80, height: 80 }}>
                  <FaStar className="text-warning" size={28} />
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark" style={{ fontSize: '0.7rem' }}>2</span>
                </div>
                <h5 className="fw-bold">Califica o recibe reviews</h5>
                <p className="text-muted small">Los arrendadores califican, los inquilinos construyen su reputación.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3 position-relative" style={{ width: 80, height: 80 }}>
                  <FaCheckCircle className="text-success" size={28} />
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" style={{ fontSize: '0.7rem' }}>3</span>
                </div>
                <h5 className="fw-bold">Decide con confianza</h5>
                <p className="text-muted small">Accede al historial verificado y toma decisiones informadas.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-5 bg-light">
        <Container>
          <Row className="align-items-center g-5">
            <Col md={6}>
              <h2 className="fw-bold mb-3">Listo para empezar?</h2>
              <p className="text-muted mb-4">
                Únete a la comunidad de arrendadores e inquilinos que ya confían en GoodRenter para construir relaciones de alquiler más seguras y transparentes.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Button variant="primary" size="lg" className="fw-bold px-4 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 14 }} onClick={() => navigate('/register')}>
                  <FaUserPlus /> Crear cuenta gratis
                </Button>
                <Button variant="outline-primary" size="lg" className="fw-bold px-4 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 14 }} onClick={() => navigate('/login')}>
                  Iniciar sesión <FaArrowRight size={14} />
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <div className="bg-white rounded-4 p-4 shadow-sm">
                <FaQuoteRight className="text-primary opacity-25 mb-2" size={24} />
                <p className="fw-medium mb-3">
                  "GoodRenter me dio la tranquilidad de saber que el inquilino que estaba recibiendo tenía buenas referencias. El proceso fue rápido y totalmente anónimo."
                </p>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary d-flex align-items-center justify-content-center rounded-circle text-white fw-bold" style={{ width: 40, height: 40, fontSize: '0.85rem' }}>MC</div>
                  <div>
                    <small className="fw-bold d-block">María C.</small>
                    <small className="text-muted">Arrendadora, Quito</small>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <footer className="bg-dark text-white py-4 text-center">
        <Container>
          <small className="opacity-75">
            © {new Date().getFullYear()} GoodRenter. Todos los derechos reservados. Cumplimiento LOPDP.
          </small>
        </Container>
      </footer>
    </>
  );
};

export default Home;
