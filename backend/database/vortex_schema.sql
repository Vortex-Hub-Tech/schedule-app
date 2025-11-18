-- Tabela de tenants (empresas)
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  plan VARCHAR(50) DEFAULT 'basic',
  settings JSONB DEFAULT '{
    "theme": "sky",
    "timezone": "America/Sao_Paulo",
    "welcomeMessage": "Bem-vindo!",
    "primaryColor": "#0ea5e9",
    "accentColor": "#38bdf8",
    "logoUrl": "",
    "backgroundStyle": "gradient",
    "enableNotifications": true,
    "enableReminders": true,
    "reminderHours": 24,
    "businessHours": {
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "14:00"},
      "sunday": {"open": null, "close": null}
    }
  }'::jsonb,
  device_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_nitro_device_id ON tenants(nitro_device_id);

-- Tabela de integrações
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(tenant_id, is_active);