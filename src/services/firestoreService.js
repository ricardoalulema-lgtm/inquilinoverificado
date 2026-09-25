import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { hashCedula, maskCedula } from '../utils/hash';

const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const createSolicitudToken = async (hashCedulaInquilino) => {
  const token = generateToken();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 90);
  await addDoc(collection(db, 'tokens_solicitud'), {
    token,
    hash_cedula_inquilino: hashCedulaInquilino,
    usado: false,
    fecha_expiracion: expiracion,
    creado_en: serverTimestamp(),
  });
  return token;
};

export const getTokenData = async (token) => {
  const q = query(collection(db, 'tokens_solicitud'), where('token', '==', token), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
  return docData;
};

export const saveCalificacion = async (data) => {
  const docRef = await addDoc(collection(db, 'calificaciones'), {
    ...data,
    peso: 1.0,
    fecha: serverTimestamp(),
    respuesta_inquilino: '',
  });
  return docRef.id;
};

export const getCalificacionesByHash = async (hashCedula) => {
  const q = query(
    collection(db, 'calificaciones'),
    where('hash_cedula_inquilino', '==', hashCedula),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  const calificaciones = snap.docs.map((d) => ({ id: d.id, ...d.data(), fecha: d.data().fecha?.toDate() }));

  const enriched = await Promise.all(calificaciones.map(async (c) => {
    if (!c.uid_arrendador) return c;
    const userSnap = await getDoc(doc(db, 'users', c.uid_arrendador));
    if (userSnap.exists()) {
      c.arrendador_nombre = userSnap.data().nombre || '';
    }
    return c;
  }));
  return enriched;
};

export const getPromedioByHash = async (hashCedula) => {
  const calificaciones = await getCalificacionesByHash(hashCedula);
  if (calificaciones.length === 0) return null;
  const arrendadoresUnicos = new Set(calificaciones.map((c) => c.uid_arrendador).filter(Boolean));
  const now = new Date();
  let totalPeso = 0;
  let sumaPago = 0;
  let sumaCuidado = 0;
  let sumaComunicacion = 0;
  let latestDate = null;
  calificaciones.forEach((c) => {
    const meses = (now - c.fecha) / (1000 * 60 * 60 * 24 * 30);
    let peso = 1.0;
    if (meses > 24) peso = 0;
    else if (meses > 12) peso = 0.5;
    sumaPago += c.estrellas_pago * peso;
    sumaCuidado += c.estrellas_cuidado * peso;
    sumaComunicacion += c.estrellas_comunicacion * peso;
    totalPeso += peso;
    if (!latestDate || c.fecha > latestDate) latestDate = c.fecha;
  });
  if (totalPeso === 0) return null;
  const promedioGeneral = ((sumaPago + sumaCuidado + sumaComunicacion) / (totalPeso * 3)).toFixed(2);
  const promedio = parseFloat(promedioGeneral);
  if (promedio < 3.5) {
    if (arrendadoresUnicos.size < 2) {
      return { oculto: true, motivo: 'min_referencias', total: calificaciones.length };
    }
    return { oculto: true, motivo: 'promedio_bajo', promedio, total: calificaciones.length };
  }
  return {
    promedio_general: promedio,
    total_calificaciones: calificaciones.length,
    total_arrendadores: arrendadoresUnicos.size,
    detalle_ejes: {
      puntualidad_pago: Number((sumaPago / totalPeso).toFixed(2)),
      cuidado_inmueble: Number((sumaCuidado / totalPeso).toFixed(2)),
      comunicacion: Number((sumaComunicacion / totalPeso).toFixed(2)),
    },
    ultima_fecha: latestDate,
  };
};

export const searchByCedula = async (cedula) => {
  const hash = hashCedula(cedula);
  const result = await getPromedioByHash(hash);
  let inquilinoNombre = '';
  const q2 = query(collection(db, 'users'), where('hash_cedula', '==', hash));
  const userSnap = await getDocs(q2);
  if (!userSnap.empty) {
    inquilinoNombre = userSnap.docs[0].data().nombre || '';
  }
  if (!result) {
    if (inquilinoNombre) {
      return {
        encontrado: true,
        tipo: 'registrado',
        cedula_mascarada: maskCedula(cedula),
        inquilino_nombre: inquilinoNombre,
        promedio_general: 0,
        total_calificaciones: 0,
        mensaje: 'Registrado, aún sin calificaciones',
      };
    }
    return {
      encontrado: false,
      tipo: 'sin_datos',
      cedula_mascarada: maskCedula(cedula),
      inquilino_nombre: '',
      mensaje: 'Sin referencias registradas. Invite al inquilino a generar su perfil',
    };
  }
  if (result.oculto) {
    return {
      encontrado: false,
      tipo: 'oculto',
      motivo: result.motivo,
      cedula_mascarada: maskCedula(cedula),
      inquilino_nombre: inquilinoNombre,
      mensaje: 'Perfil no disponible públicamente',
    };
  }
  return {
    encontrado: true,
    tipo: 'verificado',
    cedula_mascarada: maskCedula(cedula),
    inquilino_nombre: inquilinoNombre,
    ...result,
  };
};

export const addRespuesta = async (calificacionId, respuesta, pruebaRespuestaUrl) => {
  const data = { respuesta_inquilino: respuesta };
  if (pruebaRespuestaUrl) {
    data.prueba_respuesta_url = pruebaRespuestaUrl;
  }
  await updateDoc(doc(db, 'calificaciones', calificacionId), data);
};

export const solicitarBloqueo = async (calificacionId, motivo) => {
  await updateDoc(doc(db, 'calificaciones', calificacionId), {
    bloqueo_solicitado: true,
    motivo_bloqueo: motivo,
    fecha_solicitud_bloqueo: serverTimestamp(),
  });
};

export const getDisputas = async () => {
  const q = query(
    collection(db, 'calificaciones'),
    where('bloqueo_solicitado', '==', true),
    orderBy('fecha_solicitud_bloqueo', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const resolverDisputa = async (calificacionId, accion) => {
  if (accion === 'eliminar') {
    await deleteDoc(doc(db, 'calificaciones', calificacionId));
  } else {
    await updateDoc(doc(db, 'calificaciones', calificacionId), {
      bloqueo_solicitado: false,
      motivo_bloqueo: null,
      fecha_solicitud_bloqueo: null,
    });
  }
};

export const getUserByUid = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const getUserCalificaciones = async (uid) => {
  const q = query(
    collection(db, 'calificaciones'),
    where('uid_arrendador', '==', uid),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  const calificaciones = snap.docs.map((d) => ({ id: d.id, ...d.data(), fecha: d.data().fecha?.toDate() }));

  const enriched = await Promise.all(calificaciones.map(async (c) => {
    if (!c.hash_cedula_inquilino) return c;
    const q2 = query(collection(db, 'users'), where('hash_cedula', '==', c.hash_cedula_inquilino));
    const userSnap = await getDocs(q2);
    if (!userSnap.empty) {
      c.cedula_inquilino = userSnap.docs[0].data().cedula_mascarada || '';
      c.inquilino_nombre = userSnap.docs[0].data().nombre || '';
    }
    return c;
  }));
  return enriched;
};

export const getCalificacionByUidAndHash = async (uidArrendador, hashInquilino) => {
  const q = query(
    collection(db, 'calificaciones'),
    where('uid_arrendador', '==', uidArrendador),
    where('hash_cedula_inquilino', '==', hashInquilino),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const updateCalificacionPeso = async (id, peso) => {
  await updateDoc(doc(db, 'calificaciones', id), { peso });
};

export const getTokensByHash = async (hashCedula) => {
  const q = query(
    collection(db, 'tokens_solicitud'),
    where('hash_cedula_inquilino', '==', hashCedula)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const hasVinculaciones = async (hashCedula) => {
  const qInquilino = query(
    collection(db, 'calificaciones'),
    where('hash_cedula_inquilino', '==', hashCedula),
    limit(1)
  );
  const qArrendador = query(
    collection(db, 'calificaciones'),
    where('hash_cedula_arrendador', '==', hashCedula),
    limit(1)
  );
  const qTokens = query(
    collection(db, 'tokens_solicitud'),
    where('hash_cedula_inquilino', '==', hashCedula),
    limit(1)
  );
  const [inqSnap, arrSnap, tokenSnap] = await Promise.all([getDocs(qInquilino), getDocs(qArrendador), getDocs(qTokens)]);
  return !inqSnap.empty || !arrSnap.empty || !tokenSnap.empty;
};

export const createInvitacion = async (data) => {
  const expiracion = new Date();
  expiracion.setMonth(expiracion.getMonth() + 1);
  const ref = await addDoc(collection(db, 'invitaciones'), {
    hash_cedula_inquilino: data.hash_cedula_inquilino,
    nombre_inquilino: data.nombre_inquilino || '',
    telefono_inquilino: data.telefono_inquilino || '',
    saludo: data.saludo || '',
    uid_arrendador: data.uid_arrendador,
    nombre_arrendador: data.nombre_arrendador,
    estado: 'pending',
    uid_inquilino: null,
    fecha_creacion: serverTimestamp(),
    fecha_expiracion: Timestamp.fromDate(expiracion),
    fecha_respuesta: null,
    contrato_activo: false,
    contrato_url: null,
    fecha_activacion: null,
  });
  return { id: ref.id, token: ref.id };
};

export const getInvitacionByToken = async (token) => {
  const ref = doc(db, 'invitaciones', token);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  if (data.fecha_expiracion?.toDate?.() && data.fecha_expiracion.toDate() < new Date()) {
    return null;
  }
  return data;
};

export const getInvitacionesByHash = async (hashCedula) => {
  const q = query(
    collection(db, 'invitaciones'),
    where('hash_cedula_inquilino', '==', hashCedula)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const pending = results.filter((r) => {
    if (r.estado !== 'pending') return false;
    if (r.fecha_expiracion?.toDate?.() && r.fecha_expiracion.toDate() < new Date()) return false;
    return true;
  });
  return Promise.all(pending.map(async (data) => {
    if (data.uid_arrendador) {
      const userSnap = await getDoc(doc(db, 'users', data.uid_arrendador));
      if (userSnap.exists()) {
        data.arrendador_nombre = userSnap.data().nombre || '';
      }
    }
    return data;
  }));
};

export const getInvitacionesByArrendador = async (uidArrendador) => {
  const q = query(
    collection(db, 'invitaciones'),
    where('uid_arrendador', '==', uidArrendador)
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const active = results.filter((data) => {
    if (data.estado === 'accepted') return true;
    if (data.estado === 'rejected') return false;
    if (data.fecha_expiracion?.toDate?.() && data.fecha_expiracion.toDate() < new Date()) return false;
    return true;
  });
  const enriched = await Promise.all(active.map(async (data) => {
    const expirado = data.fecha_expiracion?.toDate?.() && data.fecha_expiracion.toDate() < new Date();
    let inquilino_nombre = data.nombre_inquilino || '';
    let inquilino_cedula = '';
    if (data.uid_inquilino) {
      const userSnap = await getDoc(doc(db, 'users', data.uid_inquilino));
      if (userSnap.exists()) {
        inquilino_nombre = userSnap.data().nombre || inquilino_nombre;
        inquilino_cedula = userSnap.data().cedula_mascarada || '';
      }
    }
    if (!inquilino_cedula && data.hash_cedula_inquilino) {
      const q2 = query(collection(db, 'users'), where('hash_cedula', '==', data.hash_cedula_inquilino), limit(1));
      const userSnap2 = await getDocs(q2);
      if (!userSnap2.empty) {
        inquilino_cedula = userSnap2.docs[0].data().cedula_mascarada || '';
      }
    }
    return { ...data, expirado, inquilino_nombre, inquilino_cedula };
  }));
  return enriched;
};

export const createVinculacion = async (data) => {
  const ref = await addDoc(collection(db, 'vinculaciones'), {
    uid_arrendador: data.uid_arrendador,
    uid_inquilino: data.uid_inquilino,
    hash_cedula_inquilino: data.hash_cedula_inquilino,
    nombre_inquilino: data.nombre_inquilino || '',
    inquilino_cedula: data.inquilino_cedula || '',
    telefono_inquilino: data.telefono_inquilino || '',
    contrato_activo: false,
    contrato_url: null,
    fecha_creacion: serverTimestamp(),
    fecha_activacion: null,
  });
  return ref.id;
};

export const getVinculacionesByArrendador = async (uidArrendador) => {
  const q = query(
    collection(db, 'vinculaciones'),
    where('uid_arrendador', '==', uidArrendador)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const activarVinculacion = async (vinculacionId, contratoUrl) => {
  await updateDoc(doc(db, 'vinculaciones', vinculacionId), {
    contrato_activo: true,
    contrato_url: contratoUrl,
    fecha_activacion: serverTimestamp(),
  });
};

export const deleteInvitacion = async (invitacionId) => {
  await deleteDoc(doc(db, 'invitaciones', invitacionId));
};

export const aceptarInvitacion = async (invitacionId, uidInquilino) => {
  const invitacionRef = doc(db, 'invitaciones', invitacionId);
  const invitacionSnap = await getDoc(invitacionRef);
  if (!invitacionSnap.exists()) throw new Error('Invitacion no encontrada');
  const data = invitacionSnap.data();
  if (data.estado !== 'pending') throw new Error('Esta invitacion ya fue procesada');

  await updateDoc(invitacionRef, {
    estado: 'accepted',
    uid_inquilino: uidInquilino,
    fecha_respuesta: serverTimestamp(),
  });
};

export const rechazarInvitacion = async (invitacionId) => {
  await updateDoc(doc(db, 'invitaciones', invitacionId), {
    estado: 'rejected',
    fecha_respuesta: serverTimestamp(),
  });
};

export const deleteToken = async (tokenId) => {
  await deleteDoc(doc(db, 'tokens_solicitud', tokenId));
};

export const createPago = async (data) => {
  const ref = await addDoc(collection(db, 'pagos'), {
    uid_arrendador: data.uid_arrendador,
    hash_cedula_inquilino: data.hash_cedula_inquilino,
    vinculacion_id: data.vinculacion_id || '',
    nombre_inquilino: data.nombre_inquilino || '',
    telefono_inquilino: data.telefono_inquilino || '',
    monto: Number(data.monto),
    concepto: data.concepto || '',
    mes: Number(data.mes) || new Date().getMonth() + 1,
    anio: Number(data.anio) || new Date().getFullYear(),
    fecha_pago: data.fecha_pago,
    nota: data.nota || '',
    enviado_whatsapp: false,
    fecha_registro: serverTimestamp(),
  });
  return ref.id;
};

export const getPagosByArrendador = async (uidArrendador) => {
  const q = query(
    collection(db, 'pagos'),
    where('uid_arrendador', '==', uidArrendador),
    orderBy('fecha_registro', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPagosByInquilino = async (uidArrendador, hashCedulaInquilino) => {
  const q = query(
    collection(db, 'pagos'),
    where('uid_arrendador', '==', uidArrendador),
    where('hash_cedula_inquilino', '==', hashCedulaInquilino),
    orderBy('fecha_pago', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const marcarPagoEnviado = async (pagoId) => {
  await updateDoc(doc(db, 'pagos', pagoId), { enviado_whatsapp: true });
};

export const updateMontoArriendo = async (vinculacionId, monto) => {
  await updateDoc(doc(db, 'vinculaciones', vinculacionId), {
    monto_arriendo_mensual: Number(monto),
  });
};

export const updateDiaCorte = async (vinculacionId, dia) => {
  await updateDoc(doc(db, 'vinculaciones', vinculacionId), {
    dia_corte: Number(dia),
  });
};

export const getPagosByVinculacion = async (vinculacionId) => {
  const q = query(
    collection(db, 'pagos'),
    where('vinculacion_id', '==', vinculacionId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const getResumenPagos = (pagos, montoMensual, fechaActivacion) => {
  if (!fechaActivacion) return [];
  const act = fechaActivacion.toDate ? fechaActivacion.toDate() : new Date(fechaActivacion);
  const ahora = new Date();
  const anioInicio = act.getFullYear();
  const mesInicio = act.getMonth() + 1;
  const anioFin = ahora.getFullYear();
  const mesFin = ahora.getMonth() + 1;

  const porMes = {};
  pagos.forEach((p) => {
    const key = `${p.anio}-${String(p.mes).padStart(2, '0')}`;
    if (!porMes[key]) porMes[key] = [];
    porMes[key].push(p);
  });

  const resumen = [];
  let acumulado = 0;
  let y = anioInicio, m = mesInicio;
  while (y < anioFin || (y === anioFin && m <= mesFin)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const pagosMes = porMes[key] || [];
    const totalPagado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
    const esperado = montoMensual + acumulado;
    const saldo = Math.max(0, esperado - totalPagado);
    acumulado = saldo;
    resumen.push({
      mes: m,
      anio: y,
      label: `${MESES[m - 1]} ${y}`,
      esperado,
      pagado: totalPagado,
      saldo,
      pagos: pagosMes,
    });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return resumen;
};

export const getVinculacionesByInquilino = async (uidInquilino) => {
  const q = query(
    collection(db, 'vinculaciones'),
    where('uid_inquilino', '==', uidInquilino)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
