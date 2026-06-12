const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Failsafe .env parser
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
} catch (e) {
  console.warn("Could not read local .env file. Proceeding with environment variables.");
}

const userId = process.argv[2];
const secret = process.env.DEV_GATEWAY_SECRET;

if (!userId) {
  console.error("Error: Please provide the User ID.");
  console.log("Usage: node scripts/generate-dev-signature.js <user_id>");
  process.exit(1);
}

if (!secret) {
  console.error("Error: DEV_GATEWAY_SECRET is not defined in your environment or .env file.");
  console.log("Please define DEV_GATEWAY_SECRET in your .env first.");
  process.exit(1);
}

const signature = crypto
  .createHmac("sha256", secret)
  .update(userId)
  .digest("hex");

console.log("\n==================================================");
console.log("   KYPERFIX DEVELOPER SIGNATURE GENERATOR         ");
console.log("==================================================");
console.log(`User ID:   ${userId}`);
console.log(`Signature: ${signature}`);
console.log("==================================================");
console.log("Set the following cookie in your browser console:");
console.log(`document.cookie = "kyper_dev_signature=${signature}; path=/; max-age=2592000; SameSite=Lax";`);
console.log("==================================================\n");
