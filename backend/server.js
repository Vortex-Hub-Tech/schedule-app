require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.use('/api/tenants', tenantsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/validation', validationRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});