import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./auth"

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  let url = "";
  if (process.env.NEXT_PUBLIC_APP_URL) url = process.env.NEXT_PUBLIC_APP_URL;
  else if (process.env.VERCEL_URL) url = `https://${process.env.VERCEL_URL}`;
  else url = "http://localhost:3000";
  return url.replace(/\/$/, "");
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
    plugins: [
        inferAdditionalFields<typeof auth>()
    ]
})

export const { signIn, signUp, useSession, signOut } = authClient;
