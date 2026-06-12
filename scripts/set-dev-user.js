const fs = require("fs");
const path = require("path");

// Failsafe .env parser (must run before database imports)
try {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split("\n").forEach((line) => {
      const cleaned = line.replace(/\r/g, "").trim();
      if (!cleaned || cleaned.startsWith("#")) return;
      const parts = cleaned.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
  }
} catch (e) {}

const { db } = require("../lib/db");
const { user } = require("../lib/db/schema");
const { eq } = require("drizzle-orm");

const email = process.argv[2];

if (!email) {
  console.error("Error: Please provide the email address.");
  console.log("Usage: node scripts/set-dev-user.js <email>");
  process.exit(1);
}

if (!email.endsWith("@kyper") && !email.endsWith("@kyper.com")) {
  console.error("Error: The email address must end with '@kyper' or '@kyper.com' to pass Gate 1.");
  process.exit(1);
}

async function run() {
  try {
    const res = await db
      .update(user)
      .set({ isDev: true })
      .where(eq(user.email, email))
      .returning();

    if (res.length === 0) {
      console.error(`User with email "${email}" not found in the database.`);
      process.exit(1);
    }

    console.log("\n==================================================");
    console.log("   DEVELOPER STATUS SET SUCCESSFULLY              ");
    console.log("==================================================");
    console.log(`User:      ${res[0].name}`);
    console.log(`Email:     ${res[0].email}`);
    console.log(`User ID:   ${res[0].id}`);
    console.log(`isDev:     ${res[0].isDev}`);
    console.log("==================================================\n");
    console.log("Next Step: Run the signature generator for this User ID:");
    console.log(`node scripts/generate-dev-signature.js ${res[0].id}\n`);
  } catch (error) {
    console.error("Failed to update user:", error);
    process.exit(1);
  }
}

run();
