import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('[migrate] iniciando...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(schema);
    console.log('[migrate] schema aplicado correctamente');
  } catch (err) {
    console.error('[migrate] error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
