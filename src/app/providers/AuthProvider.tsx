'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * NextAuth.jsのSessionProviderをクライアントコンポーネントとしてラップするコンポーネント
 * App Routerでは、SessionProviderはクライアントコンポーネントとして使用する必要がある
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // セッション取得時にクレデンシャルを含める
      options={{
        clientMaxAge: 0, // 常に最新のセッション情報を取得
        keepAlive: 60, // 60秒ごとにセッション情報を更新
      }}
    >
      {children}
    </SessionProvider>
  );
}