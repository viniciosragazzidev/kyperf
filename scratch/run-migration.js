const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.ejvgpdqgwpafkkkqysax:17761132763Ra%40@aws-1-us-east-1.pooler.supabase.com:6543/postgres";
  console.log("Connecting to database:", dbUrl.split('@')[1]); // Log host only for safety

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    const migrationPath = path.join(__dirname, '../drizzle/0001_light_dark_beast.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split statements by drizzle's delimiter
    const statements = sqlContent
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to apply.`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Applying: ${stmt.substring(0, 80)}...`);
      try {
        await client.query(stmt);
        console.log("✅ Success!");
      } catch (err) {
        console.error("❌ FAILED!");
        console.error("Statement:", stmt);
        console.error("Error Message:", err.message);
        console.error("Error Detail:", err.detail || 'None');
        break; // Stop on first error
      }
    }
  } catch (err) {
    console.error("Database connection error:", err.message);
  } finally {
    await client.end();
  }
}

run();
