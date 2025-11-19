
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

// Listar todas as avaliações
router.get('/', async (req, res) => {
  try {
    const { appointment_id, service_id } = req.query;
    let query = `
      SELECT f.*, a.service_id, a.client_name, s.name as service_name
      FROM feedbacks f
      JOIN appointments a ON f.appointment_id = a.id AND f.tenant_id = a.tenant_id
      JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
      WHERE f.tenant_id = $1
    `;
    const params = [req.tenantId];

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

// Estatísticas de avaliações
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
      WHERE tenant_id = $1
    `;
    
    const result = await pool.query(statsQuery, [req.tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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

// Criar avaliação
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

    const result = await pool.query(
      `INSERT INTO feedbacks (tenant_id, appointment_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.tenantId, appointment_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar feedback:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Atualizar avaliação
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }

    const result = await pool.query(
      `UPDATE feedbacks 
       SET rating = COALESCE($1, rating), 
           comment = COALESCE($2, comment)
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [rating, comment, id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

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

module.exports = router;
