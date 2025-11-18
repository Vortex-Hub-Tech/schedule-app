
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

// Resumo geral
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate 
      ? `AND a.created_at BETWEEN $2 AND $3`
      : '';
    const params = dateFilter 
      ? [req.tenantId, startDate, endDate]
      : [req.tenantId];

    // Total de agendamentos
    const totalResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
       FROM appointments a
       WHERE tenant_id = $1 ${dateFilter}`,
      params
    );

    // Faturamento total
    const revenueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(s.price), 0) as total_revenue,
        COUNT(DISTINCT a.client_phone) as unique_clients
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.tenant_id = $1 AND a.status = 'realizado' ${dateFilter}`,
      params
    );

    // Top serviços
    const topServicesResult = await pool.query(
      `SELECT 
        s.name,
        COUNT(*) as total_bookings,
        SUM(s.price) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.tenant_id = $1 AND a.status = 'realizado' ${dateFilter}
       GROUP BY s.id, s.name
       ORDER BY total_bookings DESC
       LIMIT 5`,
      params
    );

    // Horários de pico
    const peakHoursResult = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM appointment_time) as hour,
        COUNT(*) as bookings
       FROM appointments
       WHERE tenant_id = $1 ${dateFilter}
       GROUP BY EXTRACT(HOUR FROM appointment_time)
       ORDER BY bookings DESC
       LIMIT 5`,
      params
    );

    // Clientes mais frequentes
    const topClientsResult = await pool.query(
      `SELECT 
        client_name,
        client_phone,
        COUNT(*) as total_appointments,
        MAX(appointment_date) as last_appointment
       FROM appointments
       WHERE tenant_id = $1 AND status = 'realizado' ${dateFilter}
       GROUP BY client_name, client_phone
       ORDER BY total_appointments DESC
       LIMIT 10`,
      params
    );

    res.json({
      summary: {
        ...totalResult.rows[0],
        ...revenueResult.rows[0]
      },
      topServices: topServicesResult.rows,
      peakHours: peakHoursResult.rows,
      topClients: topClientsResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// Relatório de faturamento por período
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let groupBy;
    
    switch (period) {
      case 'day':
        groupBy = 'DATE(a.appointment_date)';
        break;
      case 'week':
        groupBy = 'DATE_TRUNC(\'week\', a.appointment_date)';
        break;
      default:
        groupBy = 'DATE_TRUNC(\'month\', a.appointment_date)';
    }

    const result = await pool.query(
      `SELECT 
        ${groupBy} as period,
        COUNT(*) as total_appointments,
        SUM(s.price) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.tenant_id = $1 AND a.status = 'realizado'
       GROUP BY ${groupBy}
       ORDER BY period DESC
       LIMIT 12`,
      [req.tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar relatório de faturamento:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório' });
  }
});

// Taxa de conversão e cancelamento
router.get('/conversion', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelled,
        ROUND(COUNT(CASE WHEN status = 'realizado' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate,
        ROUND(COUNT(CASE WHEN status = 'cancelado' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as cancellation_rate
       FROM appointments
       WHERE tenant_id = $1`,
      [req.tenantId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao calcular conversão:', error);
    res.status(500).json({ error: 'Erro ao calcular métricas' });
  }
});

module.exports = router;
