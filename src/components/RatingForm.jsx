import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import StarRating from './StarRating';

const RatingForm = ({ onSubmit, initialValues, submitLabel = 'Enviar Calificación', documentoRequerido = true }) => {
  const [values, setValues] = useState({
    estrellas_pago: initialValues?.estrellas_pago || 0,
    estrellas_cuidado: initialValues?.estrellas_cuidado || 0,
    estrellas_comunicacion: initialValues?.estrellas_comunicacion || 0,
    comentario: initialValues?.comentario || '',
    prueba: null,
    fecha_inicio_contrato: initialValues?.fecha_inicio_contrato || '',
    fecha_fin_contrato: initialValues?.fecha_fin_contrato || '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const charCount = values.comentario?.length || 0;
  const maxChars = 300;

  const validate = () => {
    const newErrors = {};
    if (values.estrellas_pago === 0) newErrors.estrellas_pago = 'Debe calificar Puntualidad de Pago';
    if (values.estrellas_cuidado === 0) newErrors.estrellas_cuidado = 'Debe calificar Cuidado del Inmueble';
    if (values.estrellas_comunicacion === 0) newErrors.estrellas_comunicacion = 'Debe calificar Comunicación';
    if (charCount > maxChars) newErrors.comentario = `Máximo ${maxChars} caracteres`;
    if (documentoRequerido && !values.prueba) newErrors.prueba = 'Debe adjuntar un documento de verificación';
    if (!values.fecha_inicio_contrato) newErrors.fecha_inicio_contrato = 'Debe indicar la fecha de inicio del contrato';
    if (!values.fecha_fin_contrato) newErrors.fecha_fin_contrato = 'Debe indicar la fecha de fin del contrato';
    if (values.fecha_inicio_contrato && values.fecha_fin_contrato && values.fecha_inicio_contrato >= values.fecha_fin_contrato) {
      newErrors.fecha_fin_contrato = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarChange = (field) => (value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Alert variant="warning" className="border-0 py-3">
        <FaExclamationTriangle className="me-2" />
        <strong>Importante:</strong> Una vez que suba el documento de verificación, no podrá eliminarlo ni cambiarlo. Asegúrese de seleccionar el archivo correcto.
      </Alert>

      <Alert variant="info" className="border-0 py-3">
        <FaInfoCircle className="me-2" />
        <strong>Aviso de privacidad:</strong> Al enviar esta calificación, su nombre y cédula se adjuntarán internamente a la calificación para fines de verificación. Esta información no será visible para el inquilino.
      </Alert>

      <div className="text-end mb-2"><small className="text-muted">Todos los campos marcados con <span className="text-danger">*</span> son obligatorios</small></div>

      <Form.Group className="mb-3">
        <Form.Label>Puntualidad de Pago <span className="text-danger">*</span></Form.Label>
        <div>
          <StarRating value={values.estrellas_pago} onChange={handleStarChange('estrellas_pago')} />
        </div>
        {errors.estrellas_pago && (
          <Form.Text className="text-danger"><FaExclamationTriangle className="me-1" />{errors.estrellas_pago}</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Cuidado del Inmueble <span className="text-danger">*</span></Form.Label>
        <div>
          <StarRating value={values.estrellas_cuidado} onChange={handleStarChange('estrellas_cuidado')} />
        </div>
        {errors.estrellas_cuidado && (
          <Form.Text className="text-danger"><FaExclamationTriangle className="me-1" />{errors.estrellas_cuidado}</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Comunicación <span className="text-danger">*</span></Form.Label>
        <div>
          <StarRating value={values.estrellas_comunicacion} onChange={handleStarChange('estrellas_comunicacion')} />
        </div>
        {errors.estrellas_comunicacion && (
          <Form.Text className="text-danger"><FaExclamationTriangle className="me-1" />{errors.estrellas_comunicacion}</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="comentario">Comentario (opcional)</Form.Label>
        <Form.Control
          as="textarea"
          id="comentario"
          rows={3}
          maxLength={maxChars + 50}
          value={values.comentario}
          onChange={(e) => setValues((prev) => ({ ...prev, comentario: e.target.value }))}
          isInvalid={!!errors.comentario}
        />
        <div className="d-flex justify-content-between mt-1">
          <Form.Text className={charCount > maxChars ? 'text-danger' : 'text-muted'}>
            {errors.comentario && <><FaExclamationTriangle className="me-1" />{errors.comentario}</>}
          </Form.Text>
          <Form.Text className={charCount > maxChars ? 'text-danger' : 'text-muted'}>
            {charCount}/{maxChars}
          </Form.Text>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="fecha_inicio_contrato">Fecha de inicio del contrato <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="date"
          id="fecha_inicio_contrato"
          value={values.fecha_inicio_contrato}
          onChange={(e) => {
            setValues((prev) => ({ ...prev, fecha_inicio_contrato: e.target.value }));
            if (errors.fecha_inicio_contrato) setErrors((prev) => ({ ...prev, fecha_inicio_contrato: undefined }));
          }}
          isInvalid={!!errors.fecha_inicio_contrato}
        />
        {errors.fecha_inicio_contrato && (
          <Form.Text className="text-danger"><FaExclamationTriangle className="me-1" />{errors.fecha_inicio_contrato}</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="fecha_fin_contrato">Fecha de fin del contrato <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="date"
          id="fecha_fin_contrato"
          value={values.fecha_fin_contrato}
          onChange={(e) => {
            setValues((prev) => ({ ...prev, fecha_fin_contrato: e.target.value }));
            if (errors.fecha_fin_contrato) setErrors((prev) => ({ ...prev, fecha_fin_contrato: undefined }));
          }}
          isInvalid={!!errors.fecha_fin_contrato}
        />
        {errors.fecha_fin_contrato && (
          <Form.Text className="text-danger"><FaExclamationTriangle className="me-1" />{errors.fecha_fin_contrato}</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label htmlFor="prueba">Documento de verificación <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="file"
          id="prueba"
          accept=".pdf,.jpg,.jpeg"
          onChange={(e) => {
            setValues((prev) => ({ ...prev, prueba: e.target.files[0] || null }));
            if (errors.prueba) setErrors((prev) => ({ ...prev, prueba: undefined }));
          }}
          isInvalid={!!errors.prueba}
        />
        <Form.Text className="text-muted">Sube un comprobante, contrato o evidencia (PDF o JPG). Se aloja en Cloudinary. {documentoRequerido ? 'Obligatorio en tu primera calificación.' : 'Opcional en calificaciones siguientes.'}</Form.Text>
        {errors.prueba && (
          <Form.Text className="text-danger d-block"><FaExclamationTriangle className="me-1" />{errors.prueba}</Form.Text>
        )}
      </Form.Group>

      <div className="d-grid">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </Form>
  );
};

export default RatingForm;