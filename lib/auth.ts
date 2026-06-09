import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";

const getBaseURL = () => {
  const envUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && (!envUrl.includes("localhost") || process.env.NODE_ENV !== "production")) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export const auth = betterAuth({
    baseURL: getBaseURL(),
    trustedOrigins: [
        "https://kyperff.vercel.app",
        "https://*.vercel.app"
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            tenantId: {
                type: "string",
                required: false,
            },
            branchId: {
                type: "string",
                required: false,
            },
            role: {
                type: "string",
                required: false,
            },
            commissionRate: {
                type: "string",
                required: false,
            },
            isActive: {
                type: "number",
                required: false,
            }
        }
    },
    plugins: [
        admin(),
        nextCookies()
    ]
});
