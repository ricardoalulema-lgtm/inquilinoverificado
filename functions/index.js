const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.onCalificacionCreated = functions.firestore
  .document('calificaciones/{calificacionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const hash = data.hash_cedula_inquilino;
    const calificaciones = await db
      .collection('calificaciones')
      .where('hash_cedula_inquilino', '==', hash)
      .get();

    const now = new Date();
    let totalPeso = 0;
    let sumaPago = 0;
    let sumaCuidado = 0;
    let sumaComunicacion = 0;

    calificaciones.forEach((doc) => {
      const c = doc.data();
      const fecha = c.fecha?.toDate?.() || c.fecha;
      if (!fecha) return;
      const meses = (now - fecha) / (1000 * 60 * 60 * 24 * 30);
      let peso = 1.0;
      if (meses > 24) peso = 0;
      else if (meses > 12) peso = 0.5;
      sumaPago += c.estrellas_pago * peso;
      sumaCuidado += c.estrellas_cuidado * peso;
      sumaComunicacion += c.estrellas_comunicacion * peso;
      totalPeso += peso;
    });

    const promedio = totalPeso > 0
      ? ((sumaPago + sumaCuidado + sumaComunicacion) / (totalPeso * 3)).toFixed(2)
      : 0;

    await db.collection('promedios').doc(hash).set({
      hash_cedula: hash,
      promedio_general: parseFloat(promedio),
      total_calificaciones: calificaciones.size,
      ultima_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

exports.actualizarPesosCalificaciones = functions.pubsub
  .schedule('0 0 1 * *')
  .onRun(async (context) => {
    const calificaciones = await db.collection('calificaciones').get();
    const now = new Date();
    const batch = db.batch();
    let count = 0;

    calificaciones.forEach((doc) => {
      const data = doc.data();
      const fecha = data.fecha?.toDate?.() || data.fecha;
      if (!fecha) return;
      const meses = (now - fecha) / (1000 * 60 * 60 * 24 * 30);
      let peso = 1.0;
      if (meses > 24) peso = 0;
      else if (meses > 12) peso = 0.5;
      if (data.peso !== peso) {
        batch.update(doc.ref, { peso });
        count++;
      }
    });

    if (count > 0) await batch.commit();
    functions.logger.log(`Pesos actualizados para ${count} calificaciones`);
    return null;
  });

exports.enviarRecordatorios = functions.pubsub
  .schedule('0 9 */90 * *')
  .onRun(async (context) => {
    const users = await db
      .collection('users')
      .where('rol', '==', 'arrendador')
      .get();

    users.forEach((doc) => {
      const user = doc.data();
      functions.logger.log(`Recordatorio para ${user.email}`);
    });

    functions.logger.log('Recordatorios enviados');
    return null;
  });

exports.limpiarTokensExpirados = functions.pubsub
  .schedule('0 0 * * 0')
  .onRun(async (context) => {
    const now = new Date();
    const tokens = await db
      .collection('tokens_solicitud')
      .where('fecha_expiracion', '<', now)
      .get();

    const batch = db.batch();
    tokens.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    functions.logger.log(`Tokens expirados eliminados: ${tokens.size}`);
    return null;
  });
