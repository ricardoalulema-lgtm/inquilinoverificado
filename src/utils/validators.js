import * as yup from 'yup';

export const cedulaSchema = yup
  .string()
  .matches(/^\d{10}$/, 'La cédula debe tener 10 dígitos')
  .required('Cédula es requerida');

export const registerSchema = yup.object({
  nombre: yup.string().min(3, 'Mínimo 3 caracteres').required('Nombre requerido'),
  cedula: cedulaSchema,
  email: yup.string().email('Email inválido').required('Email requerido'),
  telefono: yup.string().matches(/^\d{7,15}$/, 'Teléfono debe tener entre 7 y 15 dígitos').required('Teléfono requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Contraseñas no coinciden')
    .required('Confirmar contraseña requerida'),
  acceptTerms: yup.boolean().oneOf([true], 'Debe aceptar Términos y Condiciones'),
  acceptPrivacy: yup.boolean().oneOf([true], 'Debe aceptar el Aviso de Privacidad'),
});

export const ratingSchema = yup.object({
  estrellas_pago: yup.number().min(1, 'Requerido').max(5).required('Requerido'),
  estrellas_cuidado: yup.number().min(1, 'Requerido').max(5).required('Requerido'),
  estrellas_comunicacion: yup.number().min(1, 'Requerido').max(5).required('Requerido'),
  comentario: yup.string().max(300, 'Máximo 300 caracteres').required('Comentario requerido'),
});

export const responseSchema = yup.object({
  respuesta: yup.string().max(300, 'Máximo 300 caracteres').required('Respuesta requerida'),
});
