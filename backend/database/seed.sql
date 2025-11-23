INSERT INTO tenants (id, name, slug, status, plan, settings) VALUES
('1', 'Tayane', 'tayane', 'active', 'premium', '{"theme": "orange", "timezone": "America/Sao_Paulo"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (tenant_id, name, description, duration, price, available_days, available_hours) VALUES
('1', 'Corte de cabelo', 'Masculino e Feminino', 60, 80.00, ARRAY['segunda', 'terça', 'quarta', 'quinta', 'sexta'], '{"start": "08:00", "end": "17:00"}');
