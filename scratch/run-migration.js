const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sqlQueries = [
  `DO $$ BEGIN
    CREATE TYPE work_status AS ENUM ('AVAILABLE', 'BUSY', 'AWAY');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" varchar(20);`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "specialties" text[];`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "work_status" "work_status" DEFAULT 'AVAILABLE' NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  );`,
  `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ('0003_mysterious_triathlon', ${Date.now()});`
];

async function run() {
  console.log("Connecting to database...");
  const client = await pool.connect();
  try {
    console.log("Beginning transaction...");
    await client.query('BEGIN');

    for (const sql of sqlQueries) {
      console.log(`Executing: ${sql}`);
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log("Migration executed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed, rolled back.", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
