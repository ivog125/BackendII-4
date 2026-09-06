# Proyecto Eventos

Plataforma de Eventos e Inscripciones — backend base construido con Node.js y Express.

Este proyecto se desarrolla de forma incremental, en entregas sucesivas. La primera entrega cubrió la base arquitectónica (configuración del servidor, estructura de carpetas por capas y rutas mínimas de verificación). La segunda entrega sumó el registro seguro de usuarios: validación de datos, normalización de email, hash de contraseñas con bcrypt y persistencia en MongoDB. Esta tercera entrega agrega autenticación completa: login con JWT, cookie httpOnly, una ruta protegida (`/current`) y logout. **Todavía no incluye** lógica de tickets ni inscripciones; eso se desarrollará en entregas posteriores.

## Temática elegida

Plataforma de Eventos e Inscripciones.

## Tecnologías usadas

- Node.js
- Express
- Mongoose (MongoDB)
- bcrypt
- jsonwebtoken
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
| `JWT_SECRET`       | Clave para firmar y verificar los JWT de sesión. Sin ella, el servidor no puede generar ni validar tokens. |
| `JWT_EXPIRES_IN`   | Tiempo de expiración del JWT (por ejemplo `1h`), alineado con el `maxAge` de la cookie de sesión. |

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
│   ├── app.js # Configuración de Express (middlewares, routers, error handler)
│ ├── server.js # Punto de entrada: carga env, conecta DB y levanta el servidor
│ ├── config/ # Configuración centralizada (env, conexión a MongoDB)
│ ├── routes/ # Definición de rutas por recurso
│ ├── controllers/ # Controladores asociados a cada ruta
│ ├── services/ # Lógica de negocio (registro, login)
│ ├── repositories/ # Acceso a datos desacoplado
│ ├── dao/ # Data Access Objects (interacción directa con Mongoose)
│ ├── models/ # Modelos de Mongoose
│ ├── middlewares/ # auth.middleware.js — protege rutas verificando el JWT de la cookie
│ └── utils/ # hash.js (bcrypt) y jwt.js (firmar/verificar tokens)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Rutas disponibles

| Método | Ruta                     | Descripción                                                  |
|--------|--------------------------|---------------------------------------------------------------|
| GET    | `/api/health`            | Verifica que el servidor está activo.                         |
| GET    | `/api/events`            | Estructura base del recurso eventos (retorna una lista vacía). |
| GET    | `/api/sessions`          | Estructura base del recurso sesiones (placeholder).            |
| POST   | `/api/sessions/register` | Registra un nuevo usuario.                                     |
| POST   | `/api/sessions/login`    | Inicia sesión y setea la cookie `currentUser` (JWT, httpOnly). |
| GET    | `/api/sessions/current`  | Ruta protegida — devuelve el usuario autenticado según la cookie. |
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

Error de validación (`400`) o email ya registrado (`409`):

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

Credenciales incorrectas (`401` — mismo mensaje sea cual sea el dato que falló, para no revelar si el email existe):

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