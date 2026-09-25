import CryptoJS from 'crypto-js';

export const hashCedula = (cedula) => {
  return CryptoJS.SHA256(cedula).toString(CryptoJS.enc.Hex);
};

export const maskCedula = (cedula) => {
  if (!cedula || cedula.length < 5) return '*****';
  return cedula.substring(0, 2) + '*****' + cedula.substring(cedula.length - 2);
};

export const getInitials = (nombre) => {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .filter((p) => p.length > 0)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
};
