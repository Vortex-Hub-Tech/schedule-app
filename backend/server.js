require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const { handleAsaasWebhook } = require('./routes/landing');
app.post('/api/webhook/asaas', express.json(), handleAsaasWebhook);

app.use(express.json());
app.use('/', express.static('public/landing'));
app.use(express.static('public'));
// Testar conexão com o banco
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Fechando conexões...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido. Fechando conexões...');
  await pool.end();
  process.exit(0);
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend rodando!' });
});

const tenantsRoutes = require('./routes/tenants');
const servicesRoutes = require('./routes/services');
const appointmentsRoutes = require('./routes/appointments');
const validationRoutes = require('./routes/validation');
const ownerRoutes = require('./routes/owner');
const smsLogsRoutes = require('./routes/sms-logs');
const analyticsRoutes = require('./routes/analytics');
const landingRoutesModule = require('./routes/landing');
const feedbacksRouter = require('./routes/feedbacks');
const chatRouter = require('./routes/chat');
const devicesRoutes = require('./routes/devices');

app.use('/api/tenants', tenantsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/sms-logs', smsLogsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', landingRoutesModule);
app.use('/api/feedbacks', feedbacksRouter);
app.use('/api/chat', chatRouter);
app.use("/api/devices", devicesRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing', 'index.html'));
});

const { startReminderJob } = require('./jobs/reminders');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  startReminderJob();
});
