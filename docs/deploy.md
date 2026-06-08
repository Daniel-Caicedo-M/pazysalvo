# Guía de despliegue

## 1. Base de datos en Supabase

1. https://supabase.com → Sign in con GitHub → New project
2. Region: East US, plan Free
3. Settings → Database → Connection string → **Session pooler** (puerto 5432)
4. Copia y pega en `backend/.env` como `DATABASE_URL`
5. Reemplaza `[YOUR-PASSWORD]` por la contraseña de la BD (sin corchetes, sin caracteres especiales raros)

## 2. Backend en Render.com

1. https://render.com → New + → Web Service → conectar repo
2. Configuración:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Plan: Free
3. Environment variables (copiar de `.env` local):
   ```
   NODE_ENV=production
   DATABASE_URL=...
   JWT_SECRET=...
   SIGNATURE_SECRET=...
   INITIAL_PASSWORD=Siesa2026*
   FRONTEND_URL=https://tu-usuario.github.io
   RESEND_API_KEY=re_...
   APP_URL=https://tu-usuario.github.io/paz-y-salvo
   RECORDATORIO_DIAS_UMBRAL=2
   RECORDATORIO_CRON_SECRET=...
   ```

## 3. Frontend en GitHub Pages

GitHub Actions workflow ya incluido en `.github/workflows/deploy.yml`.

En el repo: Settings → Pages → Source: GitHub Actions
En el repo: Settings → Secrets → New: `VITE_API_URL` = URL de Render

## 4. Recordatorios automáticos diarios

Usar cron-job.org (gratis):
- URL: `https://tu-backend.onrender.com/api/recordatorios/cron?secret=TU_SECRET`
- Method: POST
- Schedule: diario, 9:00 AM

O GitHub Actions con cron schedule (ver `docs/recordatorios.md`).
