ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_appointments_device_id ON appointments(device_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_device ON appointments(tenant_id, device_id);
