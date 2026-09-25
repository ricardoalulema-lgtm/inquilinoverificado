import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { hashCedula, maskCedula } from '../utils/hash';

export const registerWithEmail = async (nombre, cedula, email, telefono, password, rol) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const hash = hashCedula(cedula);
  const cedula_mascarada = maskCedula(cedula);
  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      rol,
      email,
      hash_cedula: hash,
      cedula_mascarada,
      nombre,
      telefono,
      fecha_registro: serverTimestamp(),
    });
  } catch (err) {
    await deleteUser(result.user);
    throw err;
  }
  return result;
};

export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
