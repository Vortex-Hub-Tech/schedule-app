-- Adicionar campos de moderação à tabela feedbacks
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS auto_moderated BOOLEAN DEFAULT FALSE;

-- Status possíveis: pending, approved, rejected
-- pending: aguardando moderação
-- approved: aprovado (exibido publicamente)
-- rejected: rejeitado (não exibido)

-- Criar índice para melhorar performance nas consultas de moderação
CREATE INDEX IF NOT EXISTS idx_feedbacks_moderation ON feedbacks(tenant_id, moderation_status);

-- Aprovar automaticamente todas as avaliações existentes
UPDATE feedbacks 
SET moderation_status = 'approved', 
    moderated_at = CURRENT_TIMESTAMP,
    auto_moderated = TRUE
WHERE moderation_status IS NULL OR moderation_status = 'pending';
