import bcrypt from 'bcrypt';
import { pool, query } from './index.js';
import 'dotenv/config';

const INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'Siesa2026*';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const usuarios = [
  { email: 'admin@siesa.com',      nombre: 'Administrador del Sistema',          area: 'Administración del Sistema',              rol: 'admin' },
  { email: 'abermudez@siesa.com',  nombre: 'Angélica Bermúdez',                  area: 'RRHH',                                    rol: 'rrhh' },
  { email: 'abuitrago@siesa.com',  nombre: 'Álvaro Buitrago',                    area: 'Soluciones IT',                           rol: 'firmante' },
  { email: 'wsanchez@siesa.com',   nombre: 'Walther Sánchez',                    area: 'Soluciones IT',                           rol: 'firmante' },
  { email: 'scasquete@siesa.com',  nombre: 'Shirley Casquete',                   area: 'Investigación y Desarrollo / Siesa Digital', rol: 'firmante' },
  { email: 'dsolis@siesa.com',     nombre: 'Diana Solís',                        area: 'Administrativo y Financiero',             rol: 'firmante' },
  { email: 'amquintero@siesa.com', nombre: 'Ángela María Quintero',              area: 'Administrativo y Financiero',             rol: 'firmante' },
  { email: 'jmostacilla@siesa.com',nombre: 'José Wvarley Mostacilla Herrera',    area: 'BI',                                      rol: 'firmante' },
  { email: 'jgonzalez@siesa.com',  nombre: 'Jaime González',                     area: 'Nube',                                    rol: 'firmante' },
  { email: 'jsarango@siesa.com',   nombre: 'Juan Sebastián Arango',              area: 'Nube',                                    rol: 'firmante' },
  { email: 'vcollazos@siesa.com',  nombre: 'Vanessa Collazos',                   area: 'Consultoría',                             rol: 'firmante' },
  { email: 'arvera@siesa.com',     nombre: 'Andrea Raissa Tatiana Vera',         area: 'Soporte',                                 rol: 'firmante' },
];

async function seed() {
  console.log('[seed] hasheando contraseña inicial...');
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_ROUNDS);
  console.log(`[seed] insertando ${usuarios.length} usuarios...`);
  for (const u of usuarios) {
    await query(
      `INSERT INTO usuarios (email, nombre, area, rol, password_hash, must_change_pwd)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [u.email.toLowerCase(), u.nombre, u.area, u.rol, passwordHash]
    );
    console.log(`  ✓ ${u.email}`);
  }
  console.log(`\n[seed] contraseña inicial: ${INITIAL_PASSWORD}`);
  await pool.end();
}

seed().catch(err => {
  console.error('[seed] error:', err);
  process.exit(1);
});
