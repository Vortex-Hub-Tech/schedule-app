const express = require('express');
const router = express.Router();
const nitroSMS = require('../services/nitrosms');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

router.get('/', async (req, res) => {
  try {
    const { phone, status, startDate, endDate, limit = 100 } = req.query;
    
    const filters = {
      phone,
      status,
      startDate,
      endDate,
      limit: parseInt(limit)
    };

    const logs = await nitroSMS.getSMSLogs(req.tenantId, filters);
    
    res.json({
      total: logs.length,
      logs: logs
    });
  } catch (error) {
    console.error('❌ Erro ao buscar logs de SMS:', error.message);
    res.status(500).json({ error: 'Erro ao buscar logs de SMS' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const statsResult = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        DATE(created_at) as date
       FROM sms_logs 
       WHERE tenant_id = $1
       GROUP BY status, DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [req.tenantId]
    );

    const totalResult = await pool.query(
      `SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM sms_logs 
       WHERE tenant_id = $1`,
      [req.tenantId]
    );

    res.json({
      stats: statsResult.rows,
      totals: totalResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de SMS:', error.message);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
