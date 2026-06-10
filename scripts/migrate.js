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

async function runDirectSql() {
  console.log("Executando a criação da tabela work_order_status_history diretamente...");
  const client = await pool.connect();
  try {
    const sqlFilePath = path.join(__dirname, '../drizzle/0004_secret_spitfire.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Arquivo de migração não encontrado: ${sqlFilePath}`);
    }

    let sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Remove os marcadores de breakpoint do Drizzle Kit
    sqlContent = sqlContent.replace(/--> statement-breakpoint/g, '');

    // Executa as queries diretamente
    await client.query(sqlContent);
    console.log("Tabela work_order_status_history criada com sucesso no banco de dados!");
  } catch (error) {
    console.error("Erro ao rodar SQL de migração:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runDirectSql();
