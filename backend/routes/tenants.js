const express = require('express');
const router = express.Router();
const { pool, vortexPool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await vortexPool.query(
      `SELECT DISTINCT 
        t.id, 
        t.name, 
        t.slug, 
        t.plan,
        t.settings
       FROM tenants t
       INNER JOIN integrations i ON t.id = i.tenant_id
       WHERE t.status = 'active'
       AND i.name = 'Agendamento'
       AND i.type = 'app'
       AND i.is_active = true
       ORDER BY t.name ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
    res.status(500).json({ error: 'Erro ao buscar empresas disponíveis' });
  }
});

router.get('/:id/bootstrap', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenantResult = await vortexPool.query(
      `SELECT DISTINCT 
        t.id, 
        t.name, 
        t.slug, 
        t.plan,
        t.settings
       FROM tenants t
       INNER JOIN integrations i ON t.id = i.tenant_id
       WHERE t.id = $1
       AND t.status = 'active'
       AND i.name = 'Agendamento'
       AND i.type = 'app'
       AND i.is_active = true
       LIMIT 1`,
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const tenant = tenantResult.rows[0];

    const servicesResult = await pool.query(
      'SELECT COUNT(*) as count FROM services WHERE tenant_id = $1',
      [id]
    );

    const appointmentsResult = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND status = $2',
      [id, 'pendente']
    );

    res.json({
      tenant,
      stats: {
        services: parseInt(servicesResult.rows[0].count),
        pendingAppointments: parseInt(appointmentsResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar bootstrap:', error);
    res.status(500).json({ error: 'Erro ao carregar dados da empresa' });
  }
});

module.exports = router;
