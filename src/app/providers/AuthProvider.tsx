'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * AuthProvider
 * - NextAuth.js の SessionProvider をラップするクライアントコンポーネント
 * - サーバー側で取得した初期セッション(initialSession)を渡すことで、
 *   マウント時の /api/auth/session 取得(FETCH)を省略し、余計なエラーや中断(ABORTED)を防ぐ
 * - さらに refetch を無効化して、バックグラウンドでのセッション再取得を抑制
 * - 追加: アプリ全体の画像ダウンロード抑止（右クリック、ドラッグ）をグローバルで制御
 */
export default function AuthProvider({ 
  children, 
  initialSession,
}: { 
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  // 画像の右クリック保存やドラッグを抑止（全体適用）
  useEffect(() => {
    /** コンテキストメニュー抑止（img/picture 上のみ） */
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('img') || target.closest('picture'))) {
        e.preventDefault();
      }
    };

    /** 画像のドラッグ開始抑止 */
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('img') || target.closest('picture'))) {
        e.preventDefault();
      }
    };

    /** 画像の選択開始抑止（ダブルクリック選択などの防止） */
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('img') || target.closest('picture'))) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

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