'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // セッション情報を確認
    const checkSession = async () => {
      try {
        // NextAuth.jsのセッションAPIを使用してセッション情報を取得
        // クレデンシャルを含めて送信
        // 環境変数からAPI URLを取得（デフォルトは空文字列）
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const session = await response.json();
          setIsAuthenticated(!!session && Object.keys(session).length > 0);
        } else {
          console.error('セッション取得エラー:', response.statusText);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-12">
        <main className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">あなただけの<br />特別な<br />キャラクターを<br />育てよう！</h2>
            <p className="text-xl mb-8 text-white/80">CoCharaは、あなたの創造性を形にするキャラクター育成アプリです。特別な卵から生まれるキャラクターと一緒に、新しい冒険を始めましょう。</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center sm:justify-start">
              <Link href="/character/create" className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-indigo-100 transition-colors flex items-center justify-center">
                卵ガチャ
              </Link>
              <Link href="/about" className="border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center">
                詳しく見る
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-yellow-300 to-pink-400 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-8 bg-gradient-to-r from-blue-400 to-teal-300 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">✨</span>
              </div>
            </div>
          </div>
        </main>

        <section className="mt-24 text-white">
          <h2 className="text-3xl font-bold text-center mb-12">CoCharaの特徴</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center mb-4">
              <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-center flex items-center justify-center w-full">🥚</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">ユニークな卵</h3>
              <p className="text-white/80">様々な特性を持つ卵からキャラクターが誕生します。レアな卵を集めて特別なキャラクターを育てましょう。</p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center mb-4">
              <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-center flex items-center justify-center w-full">🌱</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">成長と進化</h3>
              <p className="text-white/80">キャラクターはあなたの関わり方によって成長し、進化します。独自の進化ルートを探索しましょう。</p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center mb-4">
              <div className="bg-pink-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-center flex items-center justify-center w-full">🔮</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">コンテンツ共有</h3>
              <p className="text-white/80">キャラクターと一緒にコンテンツを作成し、友達と共有できます。あなたの創造性を形にしましょう。</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
