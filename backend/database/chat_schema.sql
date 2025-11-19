
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_client BOOLEAN NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_appointment ON chat_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
