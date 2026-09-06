# Proyecto Eventos

Plataforma de Eventos e Inscripciones — backend base construido con Node.js y Express.

Este proyecto se desarrolla de forma incremental, en entregas sucesivas. La primera entrega cubrió la base arquitectónica (configuración del servidor, estructura de carpetas por capas y rutas mínimas de verificación). La segunda entrega sumó el registro seguro de usuarios: validación de datos, normalización de email, hash de contraseñas con bcrypt y persistencia en MongoDB. La tercera entrega agregó autenticación completa: login con JWT, cookie httpOnly, una ruta protegida (`/current`) y logout. Esta cuarta entrega centraliza toda esa autenticación en **Passport.js**: el registro, el login y la verificación de `/current` ahora viven como estrategias de Passport en lugar de lógica manual repartida entre servicio y middleware. El contrato externo de los endpoints (rutas, status codes, forma de las respuestas) **no cambió** respecto a la entrega anterior. **Todavía no incluye** lógica de tickets ni inscripciones; eso se desarrollará en entregas posteriores.

## Temática elegida

Plataforma de Eventos e Inscripciones.

## Tecnologías usadas

- Node.js
- Express
- Mongoose (MongoDB)
- bcrypt
- jsonwebtoken
- passport
- passport-local
- passport-jwt
- cookie-parser
- dotenv
- Módulos ESM (`import`/`export`)

## Instalación

```bash
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

| Variable          | Descripción                                                        |
|--------------------|---------------------------------------------------------------------|
| `PORT`             | Puerto en el que escucha el servidor (fallback a `8080` si no se define). |
| `NODE_ENV`         | Entorno de ejecución (`development`, `production`, etc.). Determina si la cookie de sesión se marca como `secure`. |
| `MONGO_URL`        | Cadena de conexión a MongoDB. Necesaria para registro y login. |
| `JWT_SECRET`       | Clave para firmar y verificar los JWT de sesión. También la usa la estrategia `current` de Passport para validar el token. |
| `JWT_EXPIRES_IN`   | Tiempo de expiración del JWT (por ejemplo `1h`), alineado con el `maxAge` de la cookie de sesión. |

No se agregaron variables de entorno nuevas en esta entrega: Passport reutiliza `JWT_SECRET` y `JWT_EXPIRES_IN` ya existentes.

## Cómo ejecutar el proyecto

Modo desarrollo (con recarga automática usando `node --watch`):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

## Estructura de carpetas

```
├── src/
│   ├── app.js # Configuración de Express (middlewares, passport.initialize(), routers, error handler)
│ ├── server.js # Punto de entrada: carga env, conecta DB y levanta el servidor
│ ├── config/ # Configuración centralizada: env, conexión a MongoDB y passport.config.js (estrategias)
│ ├── routes/ # Definición de rutas por recurso
│ ├── controllers/ # Controladores asociados a cada ruta
│ ├── repositories/ # Acceso a datos desacoplado
│ ├── dao/ # Data Access Objects (interacción directa con Mongoose)
│ ├── models/ # Modelos de Mongoose
│ └── utils/ # hash.js (bcrypt) y jwt.js (firmar/verificar tokens)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Nota: en esta entrega se eliminó `src/services/sessions.service.js` (su lógica pasó a vivir dentro de las estrategias de Passport) y `src/middlewares/auth.middleware.js` (reemplazado por la estrategia `current` de `passport-jwt`).

## Autenticación con Passport.js

`src/config/passport.config.js` define tres estrategias, inicializadas en `app.js` antes de montar las rutas:

- **`register`** (`passport-local`, con `usernameField: 'email'` y `passReqToCallback: true`): valida los campos obligatorios, formato de email, longitud mínima de contraseña y que el email no esté ya registrado; si todo es correcto, hashea la contraseña con bcrypt y crea el usuario.
- **`login`** (`passport-local`, misma configuración de campo): busca el usuario por email y compara la contraseña con bcrypt. Devuelve el mismo mensaje genérico de error tanto si el email no existe como si la contraseña es incorrecta, para no revelar cuál de los dos falló.
- **`current`** (`passport-jwt`): extrae el JWT desde la cookie `currentUser` (no desde el header `Authorization`, que es lo que usa por defecto) mediante un extractor custom, y lo valida contra `JWT_SECRET`.

Las tres estrategias se usan con `{ session: false }`, porque la autenticación es completamente stateless vía JWT — no hay `express-session` ni sesión de servidor. En `src/routes/sessions.router.js`, un wrapper `authenticate(strategy)` llama a `passport.authenticate` con un callback propio para traducir el resultado de cada estrategia a la forma de respuesta esperada (mismos status codes y mensajes que en la entrega anterior).

**Extensibilidad:** agregar un proveedor externo (por ejemplo, login con Google o GitHub) implicaría sumar una nueva estrategia en `passport.config.js` y una ruta que la use, sin tocar `app.js` ni el resto de las rutas existentes.

## Rutas disponibles

| Método | Ruta                     | Descripción                                                  |
|--------|--------------------------|---------------------------------------------------------------|
| GET    | `/api/health`            | Verifica que el servidor está activo.                         |
| GET    | `/api/events`            | Estructura base del recurso eventos (retorna una lista vacía). |
| GET    | `/api/sessions`          | Estructura base del recurso sesiones (placeholder).            |
| POST   | `/api/sessions/register` | Registra un nuevo usuario (estrategia `register` de Passport). |
| POST   | `/api/sessions/login`    | Inicia sesión y setea la cookie `currentUser` (JWT, httpOnly) (estrategia `login`). |
| GET    | `/api/sessions/current`  | Ruta protegida — devuelve el usuario autenticado según la cookie (estrategia `current`). |
| POST   | `/api/sessions/logout`   | Cierra la sesión, eliminando la cookie `currentUser`.          |

### Registro de usuarios (`POST /api/sessions/register`)

Body esperado (JSON):

| Campo        | Tipo   | Requerido | Descripción                                  |
|--------------|--------|-----------|-----------------------------------------------|
| `first_name` | string | sí        | Nombre del usuario.                            |
| `last_name`  | string | sí        | Apellido del usuario.                          |
| `email`      | string | sí        | Email del usuario (se normaliza a minúsculas). |
| `password`   | string | sí        | Contraseña (mínimo 8 caracteres).              |

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "password": "supersecreta"
  }'
```

Respuesta exitosa (`201 Created`):

```json
{
  "status": "success",
  "payload": {
    "id": "65123abc...",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "role": "user"
  }
}
```

Errores posibles: `400` (campos faltantes, email inválido o contraseña corta) y `409` (email ya registrado):

```json
{
  "status": "error",
  "message": "Descripción del error"
}
```

### Login (`POST /api/sessions/login`)

Body esperado: `email` y `password`.

```bash
curl -i -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "supersecreta" }'
```

Respuesta exitosa (`200`, además setea la cookie `currentUser` httpOnly):

```json
{ "status": "success", "message": "Login correcto" }
```

Credenciales incorrectas o faltantes (`401` — mismo mensaje sea cual sea el dato que falló, para no revelar si el email existe):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

### Ruta protegida (`GET /api/sessions/current`)

Requiere la cookie `currentUser` (la pone el login). Con `curl`, guardando y reenviando cookies:

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "supersecreta" }'

curl -b cookies.txt http://localhost:8080/api/sessions/current
```

Respuesta exitosa (`200`):

```json
{
  "status": "success",
  "payload": { "id": "665f2a...", "email": "ada@example.com", "role": "user" }
}
```

Sin cookie, o con un token inválido/expirado (`401`):

```json
{ "status": "error", "message": "No autenticado" }
```

### Logout (`POST /api/sessions/logout`)

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/sessions/logout
```

Respuesta (`200`, elimina la cookie `currentUser`):

```json
{ "status": "success", "message": "Sesión cerrada" }
```