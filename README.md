# Paz y Salvo SIESA

Sistema digital para gestión de Paz y Salvo en procesos de retiro de colaboradores.

## Stack (100% gratuito)

- **Frontend:** React 18 + Vite + Tailwind CSS → GitHub Pages
- **Backend:** Node.js + Express → Render.com (free tier)
- **Base de datos:** PostgreSQL → Supabase free tier (500 MB)
- **Autenticación:** JWT + bcrypt + cierre por inactividad
- **Correo:** Resend free tier (100/día)
- **Firma electrónica:** Módulo in-house (SHA-256 encadenado + tabla append-only)

## Funcionalidades

- Login con correo + contraseña, cambio obligatorio en primer ingreso
- Roles: admin, rrhh, firmante, colaborador
- Cierre automático por inactividad (15 min) con aviso previo
- Creación y gestión de actas de Paz y Salvo
- Firma individual con confirmación
- **Firma masiva** de múltiples actas en una sola petición
- **Recordatorios automáticos** por correo (configurables por umbral de días)
- Cadena de firmas con hashes verificables
- Tabla `firmas` y `auditoria` append-only (triggers PostgreSQL)
- Bandeja de pendientes con badge en tiempo real

## Estructura

```
paz-y-salvo/
├── backend/          API REST en Node.js + Express
├── frontend/         SPA en React + Vite
└── docs/             Documentación técnica
```

## Setup

Ver `backend/README.md` y `frontend/README.md`. Deploy en `docs/deploy.md`.
