import { Modal, Button } from 'react-bootstrap';

const termsText = `TÉRMINOS Y CONDICIONES

1. Objeto: GoodRenter es una plataforma de referencias entre particulares. No somos un buró de crédito autorizado por la Superintendencia de Bancos.

2. Registro: Al registrarse usted declara bajo juramento tener una relación contractual de arrendamiento con la persona que califica y contar con evidencia de ello.

3. Publicación: Solo se publicará un promedio estadístico anónimo. No se publicarán nombres, direcciones ni documentos.

4. Veracidad: El arrendador es responsable legal de la veracidad de su calificación. Calificaciones falsas serán eliminadas y la cuenta suspendida.

5. Modificación: Nos reservamos el derecho de ocultar perfiles con promedio menor a 3.5/5.

6. Jurisdicción: Estos términos se rigen por las leyes de la República del Ecuador.`;

const privacyText = `AVISO DE PRIVACIDAD LOPDP

De conformidad con la Ley Orgánica de Protección de Datos Personales del Ecuador, GoodRenter informa:

1. Responsable: GoodRenter

2. Datos Recolectados: Nombre, correo, teléfono, cédula. La cédula se almacena únicamente como hash irreversible.

3. Finalidad: Generar referencias y promedios de cumplimiento contractual entre arrendadores e inquilinos para facilitar procesos de arrendamiento.

4. Base Legal: Consentimiento del titular, art. 8 LOPDP y relación contractual, art. 10 LOPDP.

5. Destinatarios: Solo arrendadores registrados que busquen una cédula específica. No se realizan transferencias internacionales.

6. Derechos ARCO: Usted puede Acceder, Rectificar, Suprimir, Oponerse y Portar sus datos. Para ejercerlos escriba a soporte@goodrenter.ec. Tiene derecho a presentar reclamo ante la Superintendencia de Protección de Datos.

7. Plazo de Conservación: Los datos se conservarán mientras el perfil esté activo o por 4 años desde la última calificación.

8. Seguridad: Usamos encriptación y hash para proteger su información.`;

const LegalModal = ({ show, onHide, type }) => {
  const title = type === 'privacy' ? 'Aviso de Privacidad LOPDP' : 'Términos y Condiciones';
  const content = type === 'privacy' ? privacyText : termsText;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre className="legal-text" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{content}</pre>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LegalModal;
