const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar serviço' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, duration, price, available_days, available_hours } = req.body;
    const result = await pool.query(
      'INSERT INTO services (tenant_id, name, description, duration, price, available_days, available_hours) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.tenantId, name, description, duration, price, available_days, JSON.stringify(available_hours)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, price, available_days, available_hours } = req.body;
    const result = await pool.query(
      'UPDATE services SET name = $1, description = $2, duration = $3, price = $4, available_days = $5, available_hours = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND tenant_id = $8 RETURNING *',
      [name, description, duration, price, available_days, JSON.stringify(available_hours), id, req.tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, req.tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.json({ message: 'Serviço removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover serviço' });
  }
});

module.exports = router;
