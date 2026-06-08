# Backend - Paz y Salvo SIESA

API REST en Node.js + Express + PostgreSQL.

## Setup local

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu DATABASE_URL de Supabase y secretos
npm run migrate
npm run seed
npm run dev
```

## Endpoints

### Auth
- `POST /api/auth/login` → `{ email, password }`
- `POST /api/auth/change-password` → `{ newPassword }` (requiere token)
- `GET  /api/auth/me`

### Actas
- `GET  /api/actas` → lista
- `GET  /api/actas/:id` → detalle
- `POST /api/actas` → crear (rrhh/admin)
- `POST /api/actas/:id/anular` → anular (admin)

### Firmas
- `POST /api/firmas` → firmar una acta
- `POST /api/firmas/masivo` → firmar varias actas
- `GET  /api/firmas/pendientes` → actas pendientes del usuario actual
- `GET  /api/firmas/verificar/:actaId` → validar cadena

### Usuarios
- `GET    /api/usuarios`
- `POST   /api/usuarios` (admin)
- `POST   /api/usuarios/:id/reset-password` (admin)
- `PATCH  /api/usuarios/:id/activo` (admin)

### Recordatorios
- `GET  /api/recordatorios/preview` (admin/rrhh)
- `POST /api/recordatorios/enviar` (admin/rrhh)
- `POST /api/recordatorios/enviar/:usuarioId` (admin/rrhh)
- `POST /api/recordatorios/cron?secret=XXX` (cron externo)

## Seguridad

- bcrypt 12 rounds para contraseñas
- JWT expira en 8h
- Rate limit en login (10/15min) y global (120/min)
- Tablas `firmas` y `auditoria` append-only por triggers PostgreSQL
- Cadena de hashes encadenados (estilo blockchain) entre firmas del mismo acta
- Cierre automático de sesión por inactividad en el cliente (15 min)
