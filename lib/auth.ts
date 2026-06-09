import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
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
        nextCookies()
    ]
});
