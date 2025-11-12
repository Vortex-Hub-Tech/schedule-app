INSERT INTO tenants (id, name, slug, status, plan, settings) VALUES
('tenant-demo-1', 'Salão Beleza Total', 'salao-beleza-total', 'active', 'premium', '{"theme": "pink", "timezone": "America/Sao_Paulo"}'),
('tenant-demo-2', 'Clínica Dr. Saúde', 'clinica-dr-saude', 'active', 'professional', '{"theme": "blue", "timezone": "America/Sao_Paulo"}'),
('tenant-demo-3', 'Auto Mecânica Express', 'auto-mecanica-express', 'active', 'basic', '{"theme": "orange", "timezone": "America/Sao_Paulo"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations (id, tenant_id, name, type, config, is_active) VALUES
('int-demo-1', 'tenant-demo-1', 'Agendamento', 'app', '{"enabled": true}', true),
('int-demo-2', 'tenant-demo-2', 'Agendamento', 'app', '{"enabled": true}', true),
('int-demo-3', 'tenant-demo-3', 'Agendamento', 'app', '{"enabled": true}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (tenant_id, name, description, duration, price, available_days, available_hours) VALUES
('tenant-demo-1', 'Corte de Cabelo Feminino', 'Corte moderno e estilizado', 60, 80.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], '{"start": "09:00", "end": "18:00"}'),
('tenant-demo-1', 'Manicure e Pedicure', 'Serviço completo de unhas', 45, 50.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], '{"start": "09:00", "end": "18:00"}'),
('tenant-demo-2', 'Consulta Geral', 'Consulta médica geral', 30, 150.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta'], '{"start": "08:00", "end": "17:00"}'),
('tenant-demo-2', 'Exames de Rotina', 'Check-up completo', 60, 280.00, ARRAY['segunda', 'quarta', 'sexta'], '{"start": "07:00", "end": "12:00"}'),
('tenant-demo-3', 'Troca de Óleo', 'Troca de óleo e filtro', 30, 120.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], '{"start": "08:00", "end": "18:00"}'),
('tenant-demo-3', 'Alinhamento e Balanceamento', 'Serviço completo de alinhamento', 90, 200.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta'], '{"start": "08:00", "end": "17:00"}');
