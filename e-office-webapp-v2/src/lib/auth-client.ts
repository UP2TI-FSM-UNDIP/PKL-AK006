import { createAuthClient } from "better-auth/react";

// Dynamically determine baseURL based on environment
const getBaseURL = () => {
	const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
	if (typeof window !== "undefined") {
		// Client-side: use current origin + sub-path prefix
		return `${window.location.origin}${basePath}/api/auth`;
	}
	// Server-side: use fallback (will be replaced on client)
	return "http://localhost:3000/api/auth";
};

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
});

export const { signIn, signOut, signUp, useSession } = authClient;
