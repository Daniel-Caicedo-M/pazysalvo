# Frontend - Paz y Salvo SIESA

React + Vite + Tailwind CSS.

## Setup local

```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con URL del backend
npm run dev
# abre http://localhost:5173
```

## Páginas

- `/login` — Inicio de sesión
- `/cambiar-password` — Cambio obligatorio en primer ingreso
- `/` — Dashboard
- `/pendientes` — Bandeja de pendientes con firma masiva
- `/nueva` — Crear acta (rrhh/admin)
- `/actas/:id` — Detalle + firmar individual
- `/recordatorios` — Envío de correos a responsables (admin/rrhh)
- `/usuarios` — Administración (admin)

## Características

- **Cierre por inactividad** — 15 minutos sin actividad cierra la sesión
- **Aviso previo** — 60 segundos antes muestra modal "¿Sigues ahí?"
- **Detección de actividad** — mouse, teclado, scroll, touch
- **Mensaje al regresar** — al re-loguear muestra "Tu sesión se cerró por inactividad"

## Build

```bash
npm run build
# genera dist/
```
