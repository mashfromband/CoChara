'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * NextAuth.jsのSessionProviderをクライアントコンポーネントとしてラップするコンポーネント
 * App Routerでは、SessionProviderはクライアントコンポーネントとして使用する必要がある
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}