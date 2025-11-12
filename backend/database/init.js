const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

initDatabase();
