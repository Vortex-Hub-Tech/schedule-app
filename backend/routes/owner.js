
const express = require('express');
const router = express.Router();
const { vortexPool } = require('../db');

// Verificar se o device_id é proprietário da tenant
router.post('/verify-owner', async (req, res) => {
  try {
    const { tenantId, deviceId } = req.body;

    if (!tenantId || !deviceId) {
      return res.status(400).json({ 
        error: 'tenant_id e device_id são obrigatórios',
        isOwner: false 
      });
    }

    const result = await vortexPool.query(
      `SELECT id, name, device_id 
       FROM tenants 
       WHERE id = $1 
       AND device_id = $2 
       AND status = 'active'
       LIMIT 1`,
      [tenantId, deviceId]
    );

    const isOwner = result.rows.length > 0;

    res.json({
      isOwner,
      tenant: isOwner ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Erro ao verificar proprietário:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar proprietário',
      isOwner: false 
    });
  }
});

// Registrar device_id como proprietário (apenas se ainda não houver)
router.post('/claim-ownership', async (req, res) => {
  try {
    const { tenantId, deviceId } = req.body;

    if (!tenantId || !deviceId) {
      return res.status(400).json({ 
        error: 'tenant_id e device_id são obrigatórios' 
      });
    }

    // Verificar se a tenant já tem proprietário
    const checkResult = await vortexPool.query(
      'SELECT device_id FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrada' });
    }

    if (checkResult.rows[0].device_id) {
      return res.status(403).json({ 
        error: 'Esta empresa já possui um proprietário registrado',
        hasOwner: true
      });
    }

    // Registrar device_id como proprietário
    await vortexPool.query(
      'UPDATE tenants SET device_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [deviceId, tenantId]
    );

    res.json({ 
      success: true,
      message: 'Propriedade registrada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao registrar propriedade:', error);
    res.status(500).json({ error: 'Erro ao registrar propriedade' });
  }
});

module.exports = router;
