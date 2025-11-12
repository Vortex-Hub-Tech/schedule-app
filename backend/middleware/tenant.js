const { vortexPool } = require('../db');

async function validateTenant(req, res, next) {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID é obrigatório' });
    }

    const result = await vortexPool.query(
      `SELECT t.* FROM tenants t
       INNER JOIN integrations i ON t.id = i.tenant_id
       WHERE t.id = $1 
       AND t.status = 'active'
       AND i.name = 'Agendamento'
       AND i.type = 'app'
       AND i.is_active = true
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Tenant não encontrado ou inativo' });
    }

    req.tenant = result.rows[0];
    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error('Erro ao validar tenant:', error);
    res.status(500).json({ error: 'Erro ao validar tenant' });
  }
}

module.exports = { validateTenant };
