import { auth } from "@/lib/auth";

export const getSession = async () => {
    // In Edge Runtime (Middleware), we use the auth client or a direct fetch to the session endpoint
    // since direct database access (auth.api.getSession) might not be available depending on the adapter.
    try {
        const res = await fetch(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/get-session`, {
            headers: {
                // Pass cookies for session identification
                cookie: (await import("next/headers")).cookies().toString()
            }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
};
