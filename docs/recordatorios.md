# Configuración de recordatorios automáticos

## Resend (proveedor de correo gratuito)

1. https://resend.com → Sign up → API Keys → Create
2. Copia el key (`re_xxxxx`)
3. En `backend/.env`:
   ```
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=onboarding@resend.dev
   APP_URL=https://tu-frontend.github.io/paz-y-salvo
   ```

Modo dev: sin `RESEND_API_KEY` el sistema simula envío y muestra logs.

## Disparar manualmente

Como admin/rrhh:
- Navegar a `/recordatorios`
- Ver preview
- Click "Enviar a N responsables" o "Enviar solo a este" por usuario

## Cron automático

### cron-job.org

```
URL: https://tu-backend.onrender.com/api/recordatorios/cron?secret=TU_CRON_SECRET
Method: POST
Schedule: diario 9:00 AM
```

### GitHub Actions

`.github/workflows/recordatorios.yml`:

```yaml
name: Recordatorios diarios
on:
  schedule:
    - cron: '0 14 * * 1-5'  # 9 AM Colombia (UTC-5)
  workflow_dispatch:

jobs:
  enviar:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            "${{ secrets.BACKEND_URL }}/api/recordatorios/cron?secret=${{ secrets.CRON_SECRET }}"
```

## Configuración

- `RECORDATORIO_DIAS_UMBRAL=2` — solo notifica actas con más de N días sin firmar
- `ignorarUmbral=true` — fuerza envío de todos los pendientes (admin/rrhh desde UI)

## Plan gratuito Resend

- 100 correos/día
- 3000 correos/mes
- Suficiente para SIESA: 11 responsables × 1 correo/día = 11/día
