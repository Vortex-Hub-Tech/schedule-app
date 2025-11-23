
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');
const { moderateContent, getModerationStats } = require('../services/moderation');

router.use(validateTenant);

// Listar todas as avaliações (apenas aprovadas por padrão)
router.get('/', async (req, res) => {
  try {
    const { appointment_id, service_id, include_all } = req.query;
    let query = `
      SELECT f.*, a.service_id, a.client_name, s.name as service_name
      FROM feedbacks f
      JOIN appointments a ON f.appointment_id = a.id AND f.tenant_id = a.tenant_id
      JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
      WHERE f.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (!include_all || include_all !== 'true') {
      query += ` AND f.moderation_status = 'approved'`;
    }

    if (appointment_id) {
      params.push(appointment_id);
      query += ` AND f.appointment_id = $${params.length}`;
    }

    if (service_id) {
      params.push(service_id);
      query += ` AND a.service_id = $${params.length}`;
    }

    query += ' ORDER BY f.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Estatísticas de avaliações (apenas aprovadas)
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM feedbacks
      WHERE tenant_id = $1 AND moderation_status = 'approved'
    `;
    
    const result = await pool.query(statsQuery, [req.tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Estatísticas de moderação
router.get('/moderation/stats', async (req, res) => {
  try {
    const moderationQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN moderation_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN auto_moderated = true THEN 1 END) as auto_moderated,
        COUNT(CASE WHEN auto_moderated = false AND moderated_at IS NOT NULL THEN 1 END) as manual_moderated
      FROM feedbacks
      WHERE tenant_id = $1
    `;
    
    const result = await pool.query(moderationQuery, [req.tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de moderação:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de moderação' });
  }
});

// Buscar avaliação por agendamento
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await pool.query(
      `SELECT f.*, a.service_id, s.name as service_name
       FROM feedbacks f
       JOIN appointments a ON f.appointment_id = a.id AND f.tenant_id = a.tenant_id
       JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
       WHERE f.appointment_id = $1 AND f.tenant_id = $2`,
      [appointmentId, req.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliação' });
  }
});

// Criar avaliação (com moderação automática)
router.post('/', async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id || !rating) {
      return res.status(400).json({ error: 'Agendamento e avaliação são obrigatórios' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }

    // Verificar se o agendamento existe e está realizado
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND tenant_id = $2 AND status = $3',
      [appointment_id, req.tenantId, 'realizado']
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Agendamento não encontrado ou não foi realizado' });
    }

    // Verificar se já existe avaliação
    const existingFeedback = await pool.query(
      'SELECT * FROM feedbacks WHERE appointment_id = $1 AND tenant_id = $2',
      [appointment_id, req.tenantId]
    );

    if (existingFeedback.rows.length > 0) {
      return res.status(400).json({ error: 'Este agendamento já foi avaliado' });
    }

    // Executar moderação automática
    const moderation = moderateContent(comment, rating);
    const moderationStatus = moderation.approved ? 'approved' : 'pending';
    
    const result = await pool.query(
      `INSERT INTO feedbacks (
        tenant_id, appointment_id, rating, comment,
        moderation_status, moderation_reason, moderated_at, auto_moderated
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.tenantId, 
        appointment_id, 
        rating, 
        comment,
        moderationStatus,
        moderation.reason,
        new Date(),
        true
      ]
    );

    const response = {
      ...result.rows[0],
      moderation: {
        auto_approved: moderation.approved,
        severity: moderation.severity,
        requires_review: moderation.severity === 'medium' || moderation.severity === 'high'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar feedback:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Atualizar avaliação (com reprocessamento de moderação)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }

    // Buscar avaliação atual
    const currentFeedback = await pool.query(
      'SELECT * FROM feedbacks WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );

    if (currentFeedback.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const current = currentFeedback.rows[0];
    const updatedRating = rating !== undefined ? rating : current.rating;
    const updatedComment = comment !== undefined ? comment : current.comment;

    // Se o comentário ou rating foi alterado, reaplicar moderação automática
    let moderationStatus = current.moderation_status;
    let moderationReason = current.moderation_reason;
    let moderatedAt = current.moderated_at;
    let autoModerated = current.auto_moderated;

    if (comment !== undefined || rating !== undefined) {
      const moderation = moderateContent(updatedComment, updatedRating);
      moderationStatus = moderation.approved ? 'approved' : 'pending';
      moderationReason = moderation.reason;
      moderatedAt = new Date();
      autoModerated = true;
    }

    const result = await pool.query(
      `UPDATE feedbacks 
       SET rating = $1, 
           comment = $2,
           moderation_status = $3,
           moderation_reason = $4,
           moderated_at = $5,
           auto_moderated = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [updatedRating, updatedComment, moderationStatus, moderationReason, moderatedAt, autoModerated, id, req.tenantId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar feedback:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// Deletar avaliação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM feedbacks WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json({ message: 'Avaliação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover feedback:', error);
    res.status(500).json({ error: 'Erro ao remover avaliação' });
  }
});

// Listar avaliações pendentes de moderação
router.get('/moderation/pending', async (req, res) => {
  try {
    const query = `
      SELECT f.*, a.service_id, a.client_name, s.name as service_name
      FROM feedbacks f
      JOIN appointments a ON f.appointment_id = a.id AND f.tenant_id = a.tenant_id
      JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
      WHERE f.tenant_id = $1 AND f.moderation_status = 'pending'
      ORDER BY f.created_at DESC
    `;
    
    const result = await pool.query(query, [req.tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar avaliações pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações pendentes' });
  }
});

// Aprovar avaliação manualmente
router.post('/moderation/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { moderator_name } = req.body;
    
    const result = await pool.query(
      `UPDATE feedbacks 
       SET moderation_status = 'approved',
           moderated_at = $1,
           moderated_by = $2,
           auto_moderated = false
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [new Date(), moderator_name || 'admin', id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json({
      message: 'Avaliação aprovada com sucesso',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao aprovar avaliação:', error);
    res.status(500).json({ error: 'Erro ao aprovar avaliação' });
  }
});

// Rejeitar avaliação manualmente
router.post('/moderation/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, moderator_name } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
    }
    
    const result = await pool.query(
      `UPDATE feedbacks 
       SET moderation_status = 'rejected',
           moderation_reason = $1,
           moderated_at = $2,
           moderated_by = $3,
           auto_moderated = false
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [reason, new Date(), moderator_name || 'admin', id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json({
      message: 'Avaliação rejeitada com sucesso',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao rejeitar avaliação:', error);
    res.status(500).json({ error: 'Erro ao rejeitar avaliação' });
  }
});

// Reverter decisão de moderação (voltar para pendente)
router.post('/moderation/:id/revert', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE feedbacks 
       SET moderation_status = 'pending',
           moderation_reason = NULL,
           moderated_at = NULL,
           moderated_by = NULL,
           auto_moderated = false
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json({
      message: 'Decisão de moderação revertida com sucesso',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao reverter moderação:', error);
    res.status(500).json({ error: 'Erro ao reverter moderação' });
  }
});

module.exports = router;
