const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');
const { getTenantSubscription } = require('../middleware/planLimits');

router.use(validateTenant);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ error: 'Erro ao buscar planos' });
  }
});

router.get('/current', async (req, res) => {
  try {
    const plan = await getTenantSubscription(req.tenantId);
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const appointmentsCount = await pool.query(`
      SELECT COUNT(*) as total
      FROM appointments
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `, [req.tenantId, firstDayOfMonth, lastDayOfMonth]);

    const providersCount = await pool.query(`
      SELECT COUNT(DISTINCT device_id) as total
      FROM devices
      WHERE tenant_id = $1 AND is_owner = true
    `, [req.tenantId]);

    const usage = {
      appointments: {
        used: parseInt(appointmentsCount.rows[0].total),
        limit: plan.max_appointments_per_month,
        unlimited: plan.max_appointments_per_month === null
      },
      providers: {
        used: parseInt(providersCount.rows[0].total),
        limit: plan.max_providers,
        unlimited: plan.max_providers === null
      }
    };

    res.json({
      plan,
      usage,
      features: {
        sms_notifications: plan.has_sms_notifications,
        push_notifications: plan.has_push_notifications,
        advanced_reports: plan.has_advanced_reports,
        priority_support: plan.has_priority_support,
        multi_units: plan.has_multi_units,
        custom_api: plan.has_custom_api,
        custom_integrations: plan.has_custom_integrations,
        dedicated_manager: plan.has_dedicated_manager,
        sla: plan.has_sla
      }
    });
  } catch (error) {
    console.error('Erro ao buscar plano atual:', error);
    res.status(500).json({ error: 'Erro ao buscar plano atual' });
  }
});

router.post('/subscribe/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const tenantId = req.tenantId;

    const planCheck = await pool.query(
      'SELECT * FROM plans WHERE id = $1 AND is_active = true',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const existingSubscription = await pool.query(
      'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
      [tenantId]
    );

    if (existingSubscription.rows.length > 0) {
      await pool.query(
        `UPDATE tenant_subscriptions 
         SET plan_id = $1, status = 'active', updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2`,
        [planId, tenantId]
      );
    } else {
      await pool.query(
        `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status)
         VALUES ($1, $2, 'active')`,
        [tenantId, planId]
      );
    }

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan: planCheck.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

router.get('/limits', async (req, res) => {
  try {
    const plan = await getTenantSubscription(req.tenantId);
    
    res.json({
      appointments: {
        limit: plan.max_appointments_per_month,
        unlimited: plan.max_appointments_per_month === null
      },
      providers: {
        limit: plan.max_providers,
        unlimited: plan.max_providers === null
      },
      features: {
        sms_notifications: plan.has_sms_notifications,
        push_notifications: plan.has_push_notifications,
        advanced_reports: plan.has_advanced_reports,
        priority_support: plan.has_priority_support,
        multi_units: plan.has_multi_units,
        custom_api: plan.has_custom_api,
        custom_integrations: plan.has_custom_integrations,
        dedicated_manager: plan.has_dedicated_manager,
        sla: plan.has_sla
      }
    });
  } catch (error) {
    console.error('Erro ao buscar limites:', error);
    res.status(500).json({ error: 'Erro ao buscar limites' });
  }
});

module.exports = router;
