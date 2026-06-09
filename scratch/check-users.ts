import { db } from "../lib/db";

async function main() {
  console.log("=== CHECKING USERS ===");
  const users = await db.query.user.findMany();
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== CHECKING TENANTS ===");
  const tenants = await db.query.tenants.findMany();
  console.log(JSON.stringify(tenants, null, 2));

  console.log("\n=== CHECKING BRANCHES ===");
  const branches = await db.query.branches.findMany();
  console.log(JSON.stringify(branches, null, 2));
}

main().catch(console.error);
