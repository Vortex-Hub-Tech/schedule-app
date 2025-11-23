import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
console.log("DATABASE_URL:", process.env.DATABASE_URL);
// Pool para o banco de agendamento (services, appointments, etc)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Pool para o banco vortexdb (tenants, integrations)
const vortexPool = new Pool({
  connectionString: process.env.VORTEX_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export { pool, vortexPool };

