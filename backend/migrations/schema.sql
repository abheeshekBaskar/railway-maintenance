-- Railway Maintenance System — PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','supervisor','operator','technician')),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  equipment_code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('locomotive','freight_car','track','signal','infrastructure','other')),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational','under_maintenance','out_of_service','decommissioned')),
  last_maintenance TIMESTAMP,
  next_maintenance TIMESTAMP,
  health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  task_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  equipment_id INTEGER REFERENCES equipment(equipment_id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  work_order_id SERIAL PRIMARY KEY,
  work_order_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  equipment_id INTEGER REFERENCES equipment(equipment_id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','approved','in_progress','completed','cancelled')),
  type VARCHAR(30) DEFAULT 'corrective' CHECK (type IN ('corrective','preventive','inspection','emergency')),
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  item_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50),
  unit VARCHAR(20) DEFAULT 'pcs',
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  reorder_level INTEGER DEFAULT 10,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  supplier VARCHAR(100),
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_usage (
  usage_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES inventory(item_id) ON DELETE CASCADE,
  work_order_id INTEGER REFERENCES work_orders(work_order_id) ON DELETE SET NULL,
  used_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
  used_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  incident_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  equipment_id INTEGER REFERENCES equipment(equipment_id) ON DELETE SET NULL,
  reported_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  location VARCHAR(100),
  occurred_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info','warning','alert','success')),
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  log_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_resources (
  resource_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  type VARCHAR(20) DEFAULT 'document' CHECK (type IN ('document','video','guide','procedure')),
  url VARCHAR(500),
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_equipment ON maintenance_tasks(equipment_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_wo_equipment ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_incidents_equipment ON incidents(equipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_users_updated ON users;
DROP TRIGGER IF EXISTS trg_equipment_updated ON equipment;
DROP TRIGGER IF EXISTS trg_tasks_updated ON maintenance_tasks;
DROP TRIGGER IF EXISTS trg_wo_updated ON work_orders;
DROP TRIGGER IF EXISTS trg_inventory_updated ON inventory;
DROP TRIGGER IF EXISTS trg_incidents_updated ON incidents;
DROP TRIGGER IF EXISTS trg_training_updated ON training_resources;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_equipment_updated BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON maintenance_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wo_updated BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_training_updated BEFORE UPDATE ON training_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
