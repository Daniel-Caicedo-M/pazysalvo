-- ===========================================================
-- Paz y Salvo SIESA - Schema PostgreSQL
-- ===========================================================

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  area            VARCHAR(255),
  rol             VARCHAR(50) NOT NULL DEFAULT 'firmante',
  password_hash   VARCHAR(255) NOT NULL,
  must_change_pwd BOOLEAN NOT NULL DEFAULT TRUE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rol_valido CHECK (rol IN ('admin', 'rrhh', 'firmante', 'colaborador'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Actas de Paz y Salvo
CREATE TABLE IF NOT EXISTS actas (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(50) UNIQUE NOT NULL,
  colaborador_nombre VARCHAR(255) NOT NULL,
  colaborador_cc    VARCHAR(50) NOT NULL,
  colaborador_email VARCHAR(255),
  cargo             VARCHAR(255),
  area              VARCHAR(255),
  ciudad            VARCHAR(100),
  tipo_retiro       VARCHAR(50),
  fecha_retiro      DATE,
  estado            VARCHAR(50) NOT NULL DEFAULT 'borrador',
  creada_por        INTEGER REFERENCES usuarios(id),
  hash_contenido    VARCHAR(64),
  finalizada_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT estado_valido CHECK (estado IN ('borrador', 'en_proceso', 'finalizada', 'anulada')),
  CONSTRAINT tipo_retiro_valido CHECK (tipo_retiro IN ('Temporal', 'Definitivo'))
);

CREATE INDEX IF NOT EXISTS idx_actas_codigo ON actas(codigo);
CREATE INDEX IF NOT EXISTS idx_actas_estado ON actas(estado);
CREATE INDEX IF NOT EXISTS idx_actas_cc ON actas(colaborador_cc);

-- Responsables requeridos por acta (snapshot al momento de crearla)
CREATE TABLE IF NOT EXISTS acta_responsables (
  id            SERIAL PRIMARY KEY,
  acta_id       INTEGER NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
  usuario_id    INTEGER NOT NULL REFERENCES usuarios(id),
  area          VARCHAR(255) NOT NULL,
  orden         INTEGER NOT NULL DEFAULT 0,
  UNIQUE(acta_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_acta_resp_acta ON acta_responsables(acta_id);

-- ===========================================================
-- Tabla append-only de firmas (registro inmutable)
-- ===========================================================
CREATE TABLE IF NOT EXISTS firmas (
  id              BIGSERIAL PRIMARY KEY,
  acta_id         INTEGER NOT NULL REFERENCES actas(id),
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  usuario_email   VARCHAR(255) NOT NULL,
  usuario_nombre  VARCHAR(255) NOT NULL,
  area            VARCHAR(255) NOT NULL,
  hash_acta       VARCHAR(64) NOT NULL,
  hash_firma      VARCHAR(64) NOT NULL,
  hash_prev       VARCHAR(64),
  ip_origen       VARCHAR(64),
  user_agent      TEXT,
  observaciones   TEXT,
  firmado_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firmas_acta ON firmas(acta_id);
CREATE INDEX IF NOT EXISTS idx_firmas_usuario ON firmas(usuario_id);

CREATE OR REPLACE FUNCTION bloquear_modificacion_firmas()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es append-only. No se permite %.', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_firmas_no_update ON firmas;
CREATE TRIGGER trg_firmas_no_update
  BEFORE UPDATE ON firmas
  FOR EACH ROW EXECUTE FUNCTION bloquear_modificacion_firmas();

DROP TRIGGER IF EXISTS trg_firmas_no_delete ON firmas;
CREATE TRIGGER trg_firmas_no_delete
  BEFORE DELETE ON firmas
  FOR EACH ROW EXECUTE FUNCTION bloquear_modificacion_firmas();

-- ===========================================================
-- Auditoría (append-only)
-- ===========================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id),
  accion      VARCHAR(100) NOT NULL,
  entidad     VARCHAR(50),
  entidad_id  INTEGER,
  detalle     JSONB,
  ip_origen   VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(created_at DESC);

DROP TRIGGER IF EXISTS trg_auditoria_no_update ON auditoria;
CREATE TRIGGER trg_auditoria_no_update
  BEFORE UPDATE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION bloquear_modificacion_firmas();

DROP TRIGGER IF EXISTS trg_auditoria_no_delete ON auditoria;
CREATE TRIGGER trg_auditoria_no_delete
  BEFORE DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION bloquear_modificacion_firmas();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated ON usuarios;
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_actas_updated ON actas;
CREATE TRIGGER trg_actas_updated BEFORE UPDATE ON actas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
