'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * NextAuth.jsのSessionProviderをクライアントコンポーネントとしてラップするコンポーネント
 * App Routerでは、SessionProviderはクライアントコンポーネントとして使用する必要がある
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // 環境変数からAPI URLを取得
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  return (
    <SessionProvider 
      // セッション取得時にクレデンシャルを含める
      basePath={`${baseUrl}/api/auth`}
    >
      {children}
    </SessionProvider>
  );
}