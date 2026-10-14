import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api/admin', '')
    : 'http://localhost:3000',
});

export const { signIn, signOut, useSession } = authClient;
