'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * AuthProvider
 * - NextAuth.js の SessionProvider をラップするクライアントコンポーネント
 * - サーバー側で取得した初期セッション(initialSession)を渡すことで、
 *   マウント時の /api/auth/session 取得(FETCH)を省略し、余計なエラーや中断(ABORTED)を防ぐ
 * - さらに refetch を無効化して、バックグラウンドでのセッション再取得を抑制
 */
export default function AuthProvider({ 
  children, 
  initialSession,
}: { 
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  return (
    <SessionProvider 
      session={initialSession}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}