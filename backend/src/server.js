import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import actasRoutes from './routes/actas.js';
import firmasRoutes from './routes/firmas.js';
import usuariosRoutes from './routes/usuarios.js';
import recordatoriosRoutes from './routes/recordatorios.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 60 * 1000, max: 120,
  message: { error: 'demasiadas peticiones' },
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/firmas', firmasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/recordatorios', recordatoriosRoutes);

app.use((req, res) => res.status(404).json({ error: 'ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`[server] escuchando en http://localhost:${PORT}`);
});
