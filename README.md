# ShaffersCodePage

Landing promo desarrollada con React + Vite y desplegada en Firebase Hosting. La experiencia visual se mantiene 100% en el frontend, mientras que toda la logica sensible de asignacion de codigos corre en un backend serverless con Firebase Cloud Functions.

Sitio publicado:

- `https://shafferscode.web.app`

## Estado actual

- La web ya esta desplegada en Firebase Hosting.
- El cliente obtiene un codigo desde una Callable Cloud Function.
- Si el mismo navegador vuelve a entrar, recibe el mismo codigo.
- Cada codigo se entrega una sola vez.
- Firestore esta cerrado para el cliente y solo lo usa el backend con Admin SDK.
- La transicion visual `loading-page -> main-page -> terms-page` sigue funcionando.
- Hay scripts admin para cargar y resetear codigos.

## Stack

- React 19
- Vite 6
- Firebase Hosting
- Cloud Functions for Firebase v2
- Firebase Auth Anonymous
- Firebase App Check con reCAPTCHA
- Cloud Firestore

## Arquitectura

Frontend:

- Muestra la experiencia visual, animaciones y scroll controlado.
- Inicia sesion anonima.
- Llama a la Function `claimCode`.
- Nunca decide que codigo se entrega.

Backend serverless:

- `functions/index.js` expone `claimCode`.
- La Function valida Auth y App Check.
- La asignacion corre dentro de una transaccion en Firestore.
- Si el usuario ya tiene una asignacion en `codeAssignments`, devuelve la misma.
- Si no tiene una asignacion, toma un documento disponible en `discountCodes`, lo marca como usado y guarda el vinculo con el `uid`.

Base de datos:

- `discountCodes`: codigos disponibles y estado de uso.
- `codeAssignments`: relacion `uid -> codeId`.

## Flujo seguro

1. El visitante abre la web.
2. El frontend inicia sesion anonima con Firebase Auth.
3. El frontend llama a `claimCode`.
4. La Function verifica `request.auth` y `App Check`.
5. Si ya existe una asignacion para ese `uid`, devuelve el mismo codigo.
6. Si no existe, reclama un codigo libre en una transaccion y lo marca como usado.
7. El frontend solo renderiza el resultado.

## Seguridad

- La logica sensible no vive en el cliente.
- El cliente no puede leer ni escribir Firestore directamente.
- `firestore.rules` bloquea todo acceso desde la app cliente.
- La asignacion de codigos usa transacciones.
- App Check agrega una capa contra clientes no autorizados.
- Anonymous Auth permite persistir la asignacion por navegador sin pedir login.

Limitacion conocida:

- Sin una identidad real del usuario, no se puede garantizar "misma persona" entre dispositivos o despues de borrar datos del navegador. La regla de negocio implementada es "mismo navegador, mismo codigo".

## Requisitos de Firebase

Antes de usar el proyecto:

1. Crear un proyecto Firebase.
2. Habilitar Anonymous Auth.
3. Crear la app web y copiar su config al `.env`.
4. Configurar App Check con reCAPTCHA.
5. Crear Firestore.
6. Tener plan Blaze para deploy de Functions.

## Variables de entorno

Frontend:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FUNCTIONS_REGION`
- `VITE_FIREBASE_APPCHECK_SITE_KEY`

Opcional para desarrollo local con App Check:

- `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`

Variables opcionales para scripts admin:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `FIREBASE_SERVICE_ACCOUNT_KEY`

Referencia:

- `.env.example`

## Instalacion local

1. Crear `.env` a partir de `.env.example`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.

## Deploy

Comandos principales:

- `npm run build`
- `npm run deploy`
- `npm run deploy:hosting`

Configuracion Firebase usada por el repo:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `functions/index.js`

## Scripts admin

Carga inicial de codigos:

- `node scripts/seedDiscountCodes.js`

Reset de codigos y asignaciones:

- `node scripts/resetDiscounts.js`

Los scripts admin usan `scripts/firebaseAdmin.js`, que:

- detecta el `projectId` desde `FIREBASE_PROJECT_ID` o `.firebaserc`
- permite usar credenciales por archivo o variable de entorno
- valida que la service account pertenezca al proyecto correcto

Esto evita sembrar datos por error en otro proyecto Firebase.

## IAM necesario en produccion

La service account que ejecuta la Function debe tener permisos para:

- verificar App Check tokens
- acceder a Firestore

En este proyecto, eso se resolvio agregando los roles necesarios a la cuenta de runtime de Cloud Functions.

## Estructura relevante

- `src/App.jsx`: flujo principal de la experiencia y transiciones entre secciones
- `src/js/claimDiscount.js`: login anonimo y llamada a la callable function
- `src/config/firebase.js`: inicializacion de Firebase, Auth, Functions y App Check
- `functions/index.js`: backend serverless con la logica segura de asignacion
- `scripts/seedDiscountCodes.js`: carga de codigos
- `scripts/resetDiscounts.js`: reseteo de codigos y asignaciones

## Verificacion rapida

Comportamiento esperado:

- Primera visita en un navegador: recibe un codigo disponible.
- Segunda visita en el mismo navegador: recibe el mismo codigo.
- Otro navegador o modo incognito: recibe otro codigo si quedan disponibles.
- Si no quedan codigos, la app muestra el mensaje correspondiente.

## Nota de seguridad

`.env` y `scripts/serviceAccountKey.json` deben quedar fuera del repositorio. Si alguna credencial sensible estuvo expuesta en el historial, hay que rotarla antes de publicar el proyecto.
