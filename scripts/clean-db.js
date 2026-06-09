const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Carrega variáveis do arquivo .env
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Erro: DATABASE_URL não encontrada no arquivo .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const tables = [
  'work_order_items',
  'work_orders',
  'services_catalog',
  'parts_inventory',
  'vehicles',
  'customers',
  'verification',
  'account',
  'session',
  'user',
  'branches',
  'tenants'
];

async function clean() {
  const client = await pool.connect();
  try {
    console.log("Iniciando a limpeza do banco de dados...");
    const truncateQuery = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} CASCADE;`;
    await client.query(truncateQuery);
    console.log("Banco de dados limpo com sucesso!");
  } catch (error) {
    console.error("Erro ao limpar o banco de dados:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

clean();
