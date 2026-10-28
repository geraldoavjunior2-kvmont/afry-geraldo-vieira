-- ============================================================================
-- MC&C COMMISSIONING CONTROL SYSTEM - SUPABASE SCHEMA
-- Area 5072 - CAPTAÇÃO (Water Intake)
-- ============================================================================

-- 1. TABLE: disciplines (disciplinas)
CREATE TABLE IF NOT EXISTS disciplines (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. TABLE: subsystems (subsistemas)
CREATE TABLE IF NOT EXISTS subsystems (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) DEFAULT 'CAPTAÇÃO',
  created_at TIMESTAMP DEFAULT now()
);

-- 3. TABLE: equipment_tags (tags de equipamento)
CREATE TABLE IF NOT EXISTS equipment (
  id BIGSERIAL PRIMARY KEY,
  discipline_id BIGINT NOT NULL REFERENCES disciplines(id),
  subsystem_id BIGINT NOT NULL REFERENCES subsystems(id),
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  planned_date DATE,
  scheduled_date DATE,
  week_project VARCHAR(10),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. TABLE: assembly_stages (etapas de montagem)
CREATE TABLE IF NOT EXISTS assembly_stages (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id),
  stage_type VARCHAR(50) NOT NULL, -- 'INFRA', 'CABLE_LAYING', 'CONNECTION', 'POSITIONING', 'GROUTING', 'ASSEMBLY', 'WELDING', 'TESTS_END', 'MOUNTING'
  stage_name VARCHAR(255) NOT NULL,
  status SMALLINT DEFAULT 0, -- 0: not started, 1: completed, 0.5-0.9: in progress
  sequence_order SMALLINT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. TABLE: gate1_mechanical_completion (GATE 1: MC - Completação Mecânica)
CREATE TABLE IF NOT EXISTS gate1_mechanical_completion (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL UNIQUE REFERENCES equipment(id),
  infra SMALLINT DEFAULT 0,
  cable_laying SMALLINT DEFAULT 0,
  connection SMALLINT DEFAULT 0,
  gate1_status VARCHAR(10), -- '⚑' (complete) or '🔒' (incomplete)
  status_computed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 6. TABLE: gate2_handover (GATE 2: Handover - Comissionamento A Frio)
CREATE TABLE IF NOT EXISTS gate2_handover (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL UNIQUE REFERENCES equipment(id),
  tests_megger_hipot_loop SMALLINT DEFAULT 0, -- 0 or 1
  walkdown_punch_list VARCHAR(10), -- 'OK' or 'NOK'
  gate2_status VARCHAR(10), -- '⚑' (complete) or '🔒' (incomplete)
  status_computed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 7. TABLE: backlog_status (status do backlog)
CREATE TABLE IF NOT EXISTS backlog_status (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL UNIQUE REFERENCES equipment(id),
  status VARCHAR(50), -- 'Liberado para Comissionamento A Frio', 'Aguardando MC', etc
  computed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 8. TABLE: user_logs (auditoria e logs)
CREATE TABLE IF NOT EXISTS user_logs (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT REFERENCES equipment(id),
  action VARCHAR(100),
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_equipment_discipline ON equipment(discipline_id);
CREATE INDEX IF NOT EXISTS idx_equipment_subsystem ON equipment(subsystem_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tag ON equipment(tag);
CREATE INDEX IF NOT EXISTS idx_assembly_equipment ON assembly_stages(equipment_id);
CREATE INDEX IF NOT EXISTS idx_gate1_equipment ON gate1_mechanical_completion(equipment_id);
CREATE INDEX IF NOT EXISTS idx_gate2_equipment ON gate2_handover(equipment_id);
CREATE INDEX IF NOT EXISTS idx_backlog_equipment ON backlog_status(equipment_id);

-- ============================================================================
-- VIEWS: Summary by Discipline (RESUMO MC&C)
-- ============================================================================
CREATE OR REPLACE VIEW v_summary_by_discipline AS
SELECT
  d.name as discipline,
  COUNT(DISTINCT e.id) as total_equipment,
  COUNT(DISTINCT CASE WHEN g1.gate1_status = '⚑' THEN e.id END) as completed_gate1,
  COUNT(DISTINCT CASE WHEN g2.gate2_status = '⚑' THEN e.id END) as completed_gate2,
  COUNT(DISTINCT CASE WHEN bs.status = 'Liberado para Comissionamento A Frio' THEN e.id END) as released_to_commissioning
FROM disciplines d
LEFT JOIN equipment e ON d.id = e.discipline_id
LEFT JOIN gate1_mechanical_completion g1 ON e.id = g1.equipment_id
LEFT JOIN gate2_handover g2 ON e.id = g2.equipment_id
LEFT JOIN backlog_status bs ON e.id = bs.equipment_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- ============================================================================
-- VIEW: Equipment List with Gates Status
-- ============================================================================
CREATE OR REPLACE VIEW v_equipment_with_gates AS
SELECT
  e.id,
  e.tag,
  e.name,
  d.name as discipline,
  ss.code as subsystem_code,
  ss.name as subsystem_name,
  -- Gate 1 assembly stages
  g1.infra,
  g1.cable_laying,
  g1.connection,
  g1.gate1_status,
  -- Gate 2 handover
  g2.tests_megger_hipot_loop,
  g2.walkdown_punch_list,
  g2.gate2_status,
  -- Backlog
  bs.status as backlog_status,
  -- Dates
  e.planned_date,
  e.scheduled_date,
  e.week_project,
  e.created_at,
  e.updated_at
FROM equipment e
JOIN disciplines d ON e.discipline_id = d.id
JOIN subsystems ss ON e.subsystem_id = ss.id
LEFT JOIN gate1_mechanical_completion g1 ON e.id = g1.equipment_id
LEFT JOIN gate2_handover g2 ON e.id = g2.equipment_id
LEFT JOIN backlog_status bs ON e.id = bs.equipment_id
ORDER BY e.tag;

-- ============================================================================
-- FUNCTION: Compute Gate 1 Status
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_gate1_status(infra INT, cable_laying INT, conn INT)
RETURNS VARCHAR(10) AS $$
BEGIN
  IF infra = 1 AND cable_laying = 1 AND conn = 1 THEN
    RETURN '⚑';
  ELSE
    RETURN '🔒';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Compute Gate 2 Status
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_gate2_status(tests INT, walkdown VARCHAR)
RETURNS VARCHAR(10) AS $$
BEGIN
  IF tests = 1 AND UPPER(TRIM(walkdown)) = 'OK' THEN
    RETURN '⚑';
  ELSE
    RETURN '🔒';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Compute Backlog Status
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_backlog_status(gate1_status VARCHAR)
RETURNS VARCHAR(50) AS $$
BEGIN
  IF gate1_status = '⚑' THEN
    RETURN 'Liberado para Comissionamento A Frio';
  ELSE
    RETURN 'Aguardando MC';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS: Auto-update Gates and Backlog
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_gate1()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gate1_status := compute_gate1_status(NEW.infra, NEW.cable_laying, NEW.connection);
  NEW.status_computed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gate1_update ON gate1_mechanical_completion;
CREATE TRIGGER trg_gate1_update
  BEFORE INSERT OR UPDATE ON gate1_mechanical_completion
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_gate1();

---

CREATE OR REPLACE FUNCTION trigger_update_gate2()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gate2_status := compute_gate2_status(NEW.tests_megger_hipot_loop, NEW.walkdown_punch_list);
  NEW.status_computed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gate2_update ON gate2_handover;
CREATE TRIGGER trg_gate2_update
  BEFORE INSERT OR UPDATE ON gate2_handover
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_gate2();

---

CREATE OR REPLACE FUNCTION trigger_update_backlog()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := compute_backlog_status(
    (SELECT gate1_status FROM gate1_mechanical_completion WHERE equipment_id = NEW.equipment_id)
  );
  NEW.computed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_backlog_update ON backlog_status;
CREATE TRIGGER trg_backlog_update
  BEFORE INSERT OR UPDATE ON backlog_status
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_backlog();

-- ============================================================================
-- RLS POLICIES (Row-Level Security) - TO BE CONFIGURED AFTER LOGIN
-- ============================================================================
-- For now, allow all reads/writes. After login implementation:
-- - SELECT: authenticated users only
-- - INSERT/UPDATE/DELETE: specific roles (admin, supervisor, field_operator)
