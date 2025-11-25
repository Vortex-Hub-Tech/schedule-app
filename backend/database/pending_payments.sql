
CREATE TABLE IF NOT EXISTS pending_payments (
  id SERIAL PRIMARY KEY,
  asaas_charge_id VARCHAR(255) UNIQUE NOT NULL,
  plan_id INTEGER NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_cpf_cnpj VARCHAR(20) NOT NULL,
  tenant_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_asaas ON pending_payments(asaas_charge_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
