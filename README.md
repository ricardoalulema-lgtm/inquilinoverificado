# GoodRenter (InquilinoVerificado)

Plataforma de **referencias de arrendamiento verificadas**: los arrendadores califican a sus inquilinos (pago, cuidado, comunicación) y los inquilinos pueden ver su propio historial de contratos y pagos. Cumple con la LOPDP de Ecuador (cédula hasheada, nunca se almacena en claro).

**Demo:** https://nodebo-f1e51.web.app

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 (PWA mobile-first, offline via Workbox) |
| UI | Bootstrap 5.3 + react-bootstrap + react-icons |
| Routing | react-router-dom 7 |
| Formularios | Formik + Yup (validación declarativa) |
| Auth | Firebase Authentication (solo email/contraseña) |
| Base de datos | Cloud Firestore |
| Cloud Functions | Firebase Functions (Node.js) — agregación de promedios |
| Archivos | Cloudinary (uploads sin servidor, plan gratis) |
| Hosting | Firebase Hosting (plan Spark / gratuito) |
| Linting | oxlint |

> **Plan Spark (gratuito) por completo.** No se usa reCAPTCHA de Firebase, ni Storage, ni servicios de pago. La protección anti-bots es 100% local (honeypot + tiempo + CAPTCHA matemático).

---

## 2. Arquitectura

### 2.1 Diagrama de flujo

```
┌───────────────────────────  Navegador (SPA React)  ───────────────────────────┐
│                                                                               │
│  pages/               components/          contexts/      hooks/             │
│  ├─ Home              ├─ Navbar            └─ AuthContext └─ useBotProtection │
│  ├─ Login             ├─ Footer                                                 │
│  ├─ Register          ├─ ProtectedRoute  ─── Rutas protegidas por rol          │
│  ├─ Dashboard*        ├─ RatingForm                                                │
│  ├─ Search            ├─ SearchResult     utils/                               │
│  ├─ GestionInquilinos ├─ StarRating        ├─ hash.js    (SHA-256 + máscara)   │
│  ├─ MisContratos      └─ LegalModal        └─ validators.js (esquemas Yup)     │
│  ├─ MisPagos / MisCalificaciones                                                  │
│  └─ Profile / NotFound                                                          │
│                          │                                                     │
│              services/   ▼                                                     │
│              ├─ authService.js ────────────────┐                               │
│              ├─ firestoreService.js ───────────┤                               │
│              ├─ firebase.js (config)           │                               │
│              └─ storageService.js (no usado)   │                               │
└────────────────────────────────────────────────┼───────────────────────────────┘
                                                 │
        ┌────────────────────────────────────────┼──────────────────────────────┐
        │                     CLOUD             ▼                              │
        │  ┌────────────────────────────────────────────────────────────┐       │
        │  │  Firebase Auth         users/{uid}                        │       │
        │  │  ┌──────────────┐      calificaciones/{id}                │       │
        │  │  │ Auth         │────▶ invitaciones/{id}                  │       │
        │  │  │ email/pass   │      vinculaciones/{id}                 │       │
        │  │  └──────────────┘      pagos/{id}                         │       │
        │  │        │                tokens_solicitud/{id}             │       │
        │  │        │  Cloud Functions: onCalificacionCreated          │       │
        │  │        │  (recalcula promedio ponderado)                  │       │
        │  └────────┴─────────────────────────────────────────────────┘       │
        │  ┌───────────────────────────┐  ┌──────────────────────────────┐     │
        │  │ Cloudinary                │  │ Firebase Hosting             │     │
        │  │ uploads de pruebas y      │  │ sirve dist/ (build Vite)     │     │
        │  │ contratos (preset público)│  │ SPA rewrite a index.html     │     │
        │  └───────────────────────────┘  └──────────────────────────────┘     │
        └───────────────────────────────────────────────────────────────────────┘
```

### 2.2 Modelo de datos (Firestore)

| Colección | Propósito | Campos clave |
|-----------|-----------|--------------|
| `users` | Perfil de usuario | `rol` (admin/arrendador/inquilino), `hash_cedula` (SHA-256), `cedula_mascarada`, `nombre`, `telefono`, `email` |
| `calificaciones` | Rating del arrendador al inquilino | `hash_cedula_inquilino`, `uid_arrendador`, `estrellas_pago/cuidado/comunicacion`, `comentario`, `prueba_url`, `peso`, `fecha_inicio_contrato`, `fecha_fin_contrato` |
| `invitaciones` | Link para que un inquilino reclame su perfil | `hash_cedula_inquilino`, `uid_arrendador`, `estado`, expira en 1 mes (ID del doc = token) |
| `vinculaciones` | Relación arrendador↔inquilino | `uid_arrendador`, `uid_inquilino`, `monto_arriendo_mensual`, `dia_corte`, `contrato_activo`, `contrato_url` |
| `pagos` | Pagos/abonos por mes | `vinculacion_id`, `uid_arrendador`, `hash_cedula_inquilino`, `mes`, `anio`, `monto`, `fecha_pago`, `enviado_whatsapp` |
| `tokens_solicitud` | Solicitud de token de verificación | `hash_cedula_inquilino`, `usado` |

**Privacidad por diseño:** la cédula nunca se guarda en claro; se almacena hasheada (SHA-256) y se muestra solo la versión enmascarada (`12*****89`).

### 2.3 Rutas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/` | Home | Público |
| `/login` · `/register` | Auth | Público |
| `/dashboard` | Redirect por rol | Autenticado |
| `/dashboard/inquilino` | Panel inquilino | Rol `inquilino` |
| `/dashboard/arrendador` | Panel arrendador | Rol `arrendador` |
| `/dashboard/admin` | Panel admin | Rol `admin` |
| `/buscar` | Búsqueda por cédula | Rol `arrendador` |
| `/gestion-inquilinos` | Contratos, pagos, activación | Rol `arrendador` |
| `/calificar/:cedula` · `/r/:token` | Formulario de rating | Rol `arrendador` |
| `/mis-contratos` · `/mis-pagos` · `/mis-calificaciones` | Historial del inquilino | Rol `inquilino` |
| `/perfil` | Editar perfil | Autenticado |
| `/i/:token` | Reclamar invitación | Público |

### 2.4 Seguridad

- **Firestore Rules** (`firestore.rules`): denegación por defecto; cada colección con reglas explícitas por rol (`isAdmin`, `isArrendador`, `isInquilino`) y por propiedad (`hash_cedula_inquilino` / `uid_inquilino` coincidente).
- **Storage rules** (`storage.rules`): no se usan (uploads van a Cloudinary).
- **Anti-bots** (`src/hooks/useBotProtection.js`): honeypot oculto + tiempo mínimo de 3 s + CAPTCHA matemático local (sin servicios de pago).
- **Registro atómico** (`authService.js`): si falla la escritura del documento de usuario en Firestore, se elimina la cuenta de Auth (`deleteUser`) — evita "usuarios fantasma".
- **Sin servicios de pago**: sin reCAPTCHA de Firebase, sin Storage, sin SMS/OTP — todo plan Spark.

---

## 3. Biblioteca de funciones

### `src/services/authService.js`

| Función | Descripción |
|---------|-------------|
| `registerWithEmail(nombre, cedula, email, telefono, password, rol)` | Crea cuenta Auth + documento `users` (hashea y enmascara cédula). Rollback con `deleteUser` si falla Firestore. |
| `loginWithEmail(email, password)` | Inicia sesión con email/contraseña. |
| `logout()` | Cierra sesión. |
| `resetPassword(email)` | Envía email de recuperación de contraseña. |

### `src/services/firestoreService.js`

**Tokens y verificación**

| Función | Descripción |
|---------|-------------|
| `createSolicitudToken(hashCedulaInquilino)` | Crea una solicitud de token de verificación. |
| `getTokenData(token)` | Obtiene datos por token de invitación/calificación. |
| `getTokensByHash(hashCedula)` | Tokens de solicitud por hash de cédula. |
| `deleteToken(tokenId)` | Elimina un token. |

**Calificaciones**

| Función | Descripción |
|---------|-------------|
| `saveCalificacion(data)` | Crea una calificación (arrendador → inquilino). |
| `getCalificacionesByHash(hashCedula)` | Historial de calificaciones de un inquilino. |
| `getPromedioByHash(hashCedula)` | Promedio ponderado de calificaciones. |
| `searchByCedula(cedula)` | Búsqueda pública: devuelve `tipo` (`verificado` ≥3.5★, `oculto` <3.5★, `registrado`, `sin_datos`). |
| `addRespuesta(calificacionId, respuesta, pruebaRespuestaUrl)` | Respuesta del inquilino a una calificación. |
| `getCalificacionByUidAndHash(uidArrendador, hashInquilino)` | Calificación existente entre un par arrendador↔inquilino. |
| `getUserCalificaciones(uid)` | Calificaciones hechas *por* un usuario. |
| `updateCalificacionPeso(id, peso)` | Actualiza el peso de una calificación. |

**Moderación (admin)**

| Función | Descripción |
|---------|-------------|
| `solicitarBloqueo(calificacionId, motivo)` | Solicitud de bloqueo de una calificación. |
| `getDisputas()` | Lista de disputas pendientes. |
| `resolverDisputa(calificacionId, accion)` | Resuelve una disputa (aprobar/rechazar). |

**Invitaciones y vínculos**

| Función | Descripción |
|---------|-------------|
| `createInvitacion(data)` | Crea invitación con ID = token (expira en 1 mes). |
| `getInvitacionByToken(token)` | Devuelve `null` si expiró. |
| `getInvitacionesByHash(hashCedula)` · `getInvitacionesByArrendador(uidArrendador)` | Listados de invitaciones. |
| `aceptarInvitacion` · `rechazarInvitacion` · `deleteInvitacion` · `gestionar invitaciones` | Gestión de estados. |
| `createVinculacion(data)` | Crea la relación arrendador↔inquilino. |
| `getVinculacionesByArrendador(uidArrendador)` | Vínculos del arrendador. |
| `getVinculacionesByInquilino(uidInquilino)` | Vínculos del inquilino. |
| `activarVinculacion(vinculacionId, contratoUrl)` | Activa el contrato (`contrato_activo: true`). |
| `updateMontoArriendo(vinculacionId, monto)` | Actualiza renta mensual. |
| `updateDiaCorte(vinculacionId, dia)` | Actualiza día de corte. |
| `hasVinculaciones(hashCedula)` | ¿Tiene vínculos? (bloquea editar cédula). |

**Pagos**

| Función | Descripción |
|---------|-------------|
| `createPago(data)` | Registra pago/abono (`mes`, `anio`, `vinculacion_id`). |
| `getPagosByArrendador(uidArrendador)` | Pagos del arrendador. |
| `getPagosByInquilino(uidArrendador, hashCedulaInquilino)` | Pagos de un inquilino. |
| `getPagosByVinculacion(vinculacionId)` | Pagos de un contrato. |
| `getResumenPagos(pagos, montoMensual, fechaActivacion)` | **Resumen mensual**: esperado, pagado, saldo y deuda acumulada. |
| `marcarPagoEnviado(pagoId)` | Marca notificación de WhatsApp enviada. |

**Usuarios**

| Función | Descripción |
|---------|-------------|
| `getUserByUid(uid)` | Documento de usuario por UID. |

### `src/utils/hash.js`

| Función | Descripción |
|---------|-------------|
| `hashCedula(cedula)` | SHA-256 hex de la cédula (privacidad LOPDP). |
| `maskCedula(cedula)` | Versión enmascarada: `12*****89`. |
| `getInitials(nombre)` | Iniciales para avatares. |

### `src/utils/validators.js` (esquemas Yup)

| Export | Uso |
|--------|-----|
| `cedulaSchema` | Validación de cédula ecuatoriana. |
| `registerSchema` | Registro completo (contraseñas, términos, privacidad). |
| `ratingSchema` | Formulario de calificación. |
| `responseSchema` | Respuesta del inquilino. |

### `src/hooks/useBotProtection.js`

| Retorno | Descripción |
|---------|-------------|
| `honeypotRef` | Campo oculto anti-bots. |
| `captchaA`, `captchaB`, `captchaValue`, `setCaptchaValue` | CAPTCHA matemático local. |
| `validate()` | `true` si: honeypot vacío + ≥3 s desde carga + suma correcta. |

### `src/contexts/AuthContext.jsx`

| Retorno | Descripción |
|---------|-------------|
| `currentUser` | Usuario de Firebase Auth. |
| `userData` | Documento Firestore `users/{uid}`. |
| `loading` | Estado de carga inicial. |
| `refreshUserData()` | Recarga el documento de usuario. |

### `cloudinary-upload/index.js`

| Función | Descripción |
|---------|-------------|
| `uploadToCloudinary(file, folder)` | Sube archivo con preset sin firmar; devuelve `secure_url`. |

### `functions/index.js` (Cloud Functions)

| Función | Descripción |
|---------|-------------|
| `onCalificacionCreated` | Trigger `onCreate` sobre `calificaciones`: recalcula promedio ponderado. |

---

## 4. Estructura del proyecto

```
inquilinoverificado/
├── cloudinary-upload/       # Upload a Cloudinary (preset público)
├── functions/               # Cloud Functions de Firebase
├── public/                  # Assets estáticos
├── src/
│   ├── components/          # Navbar, Footer, RatingForm, SearchResult...
│   ├── contexts/            # AuthContext (estado de autenticación)
│   ├── hooks/               # useBotProtection (anti-bots local)
│   ├── pages/               # Todas las páginas/rutas
│   ├── services/            # authService, firestoreService, firebase
│   ├── utils/               # hash.js, validators.js
│   └── App.jsx              # Router + rutas protegidas
├── firebase.json            # Config de Hosting/Firestore/Functions
├── firestore.rules          # Reglas de seguridad de Firestore
├── firestore.indexes.json   # Índices compuestos
├── storage.rules            # Reglas de Storage (no usado en Spark)
├── vite.config.js           # Vite + PWA
└── .env.example             # Plantilla de variables de entorno
```

---

## 5. Variables de entorno

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

---

## 6. Licencia

Proyecto privado. Todos los derechos reservados.
