const { pool } = require('../db');

async function getTenantSubscription(tenantId) {
  const result = await pool.query(`
    SELECT ts.*, p.*
    FROM tenant_subscriptions ts
    JOIN plans p ON ts.plan_id = p.id
    WHERE ts.tenant_id = $1 AND ts.status = 'active'
  `, [tenantId]);

  if (result.rows.length === 0) {
    const starterPlan = await pool.query(`
      SELECT * FROM plans WHERE slug = 'starter'
    `);
    return starterPlan.rows[0];
  }

  return result.rows[0];
}

async function checkAppointmentLimit(req, res, next) {
  try {
    const tenantId = req.tenantId;
    const plan = await getTenantSubscription(tenantId);

    if (plan.max_appointments_per_month === null) {
      return next();
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM appointments
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `, [tenantId, firstDayOfMonth, lastDayOfMonth]);

    const currentCount = parseInt(countResult.rows[0].total);

    if (currentCount >= plan.max_appointments_per_month) {
      return res.status(403).json({
        error: 'Limite de agendamentos atingido',
        message: `Seu plano ${plan.name} permite até ${plan.max_appointments_per_month} agendamentos por mês.`,
        limit: plan.max_appointments_per_month,
        current: currentCount,
        upgrade_required: true
      });
    }

    req.planLimits = {
      appointmentsUsed: currentCount,
      appointmentsLimit: plan.max_appointments_per_month,
      appointmentsRemaining: plan.max_appointments_per_month - currentCount
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar limite de agendamentos:', error);
    next();
  }
}

async function checkProviderLimit(req, res, next) {
  try {
    const tenantId = req.tenantId;
    const plan = await getTenantSubscription(tenantId);

    if (plan.max_providers === null) {
      return next();
    }

    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT device_id) as total
      FROM devices
      WHERE tenant_id = $1 AND is_owner = true
    `, [tenantId]);

    const currentCount = parseInt(countResult.rows[0].total);

    if (currentCount >= plan.max_providers) {
      return res.status(403).json({
        error: 'Limite de prestadores atingido',
        message: `Seu plano ${plan.name} permite até ${plan.max_providers} prestadores.`,
        limit: plan.max_providers,
        current: currentCount,
        upgrade_required: true
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar limite de prestadores:', error);
    next();
  }
}

async function checkFeatureAccess(feature) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const plan = await getTenantSubscription(tenantId);

      const featureKey = `has_${feature}`;
      
      if (plan[featureKey] === false) {
        return res.status(403).json({
          error: 'Recurso não disponível no seu plano',
          message: `O recurso "${feature}" não está disponível no plano ${plan.name}.`,
          upgrade_required: true,
          current_plan: plan.name
        });
      }

      next();
    } catch (error) {
      console.error(`Erro ao verificar acesso ao recurso ${feature}:`, error);
      next();
    }
  };
}

module.exports = {
  getTenantSubscription,
  checkAppointmentLimit,
  checkProviderLimit,
  checkFeatureAccess
};
