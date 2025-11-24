const { pool } = require('../db');

async function getTenantSubscription(tenantId) {
  const result = await pool.query(`
    SELECT 
      ts.id as subscription_id,
      ts.tenant_id,
      ts.plan_id,
      ts.status as subscription_status,
      ts.started_at,
      ts.expires_at,
      p.id as plan_id,
      p.name as plan_name,
      p.slug as plan_slug,
      p.price as plan_price,
      p.max_appointments_per_month,
      p.max_providers,
      p.has_sms_notifications,
      p.has_push_notifications,
      p.has_advanced_reports,
      p.has_priority_support,
      p.has_multi_units,
      p.has_custom_api,
      p.has_custom_integrations,
      p.has_dedicated_manager,
      p.has_sla,
      p.description as plan_description
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

  const row = result.rows[0];
  return {
    id: row.plan_id,
    name: row.plan_name,
    slug: row.plan_slug,
    price: row.plan_price,
    max_appointments_per_month: row.max_appointments_per_month,
    max_providers: row.max_providers,
    has_sms_notifications: row.has_sms_notifications,
    has_push_notifications: row.has_push_notifications,
    has_advanced_reports: row.has_advanced_reports,
    has_priority_support: row.has_priority_support,
    has_multi_units: row.has_multi_units,
    has_custom_api: row.has_custom_api,
    has_custom_integrations: row.has_custom_integrations,
    has_dedicated_manager: row.has_dedicated_manager,
    has_sla: row.has_sla,
    description: row.plan_description,
    subscription_id: row.subscription_id,
    subscription_status: row.subscription_status,
    started_at: row.started_at,
    expires_at: row.expires_at
  };
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
