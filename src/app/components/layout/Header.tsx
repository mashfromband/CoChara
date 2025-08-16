'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link href="/" className="text-2xl font-bold flex items-center">
            <span className="mr-2">🥚</span>
            <span>CoChara</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/" className="hover:text-indigo-200 transition-colors">
              ホーム
            </Link>
            <Link href="/character/create" className="hover:text-indigo-200 transition-colors">
              卵ガチャ
            </Link>
            <Link href="/about" className="hover:text-indigo-200 transition-colors">
              CoChara について
            </Link>
            <div className="ml-6 flex space-x-3 items-center">
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="bg-white text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors">
                    ログイン
                  </Link>
                  <Link href="/register" className="bg-indigo-800 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-900 transition-colors">
                    会員登録
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/profile" prefetch={false} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="bg-indigo-800 p-1.5 rounded-full overflow-hidden w-8 h-8 flex items-center justify-center">
                      {session?.user?.image ? (
                        <img
                          src={session.user.image as string}
                          alt="アバター"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User size={18} className="text-white" />
                      )}
                    </div>
                    <span className="text-white font-medium">{session?.user?.name}</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="bg-white text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* モバイルメニューボタン */}
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label="メニュー"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* モバイルナビゲーション */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="block py-2 hover:bg-indigo-700 hover:text-white rounded px-3 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ホーム
                </Link>
              </li>
              <li>
                <Link 
                  href="/character/create" 
                  className="block py-2 hover:bg-indigo-700 hover:text-white rounded px-3 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  卵ガチャ
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="block py-2 hover:bg-indigo-700 hover:text-white rounded px-3 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CoChara について
                </Link>
              </li>
              {!isAuthenticated ? (
                <>
                  <li className="pt-2 border-t border-indigo-500 mt-2">
                    <Link 
                      href="/login" 
                      className="block py-2 bg-white text-indigo-600 rounded px-3 transition-colors text-center font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ログイン
                    </Link>
                  </li>
                  <li className="mt-2">
                    <Link 
                      href="/register" 
                      className="block py-2 bg-indigo-800 text-white rounded px-3 transition-colors text-center font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                  会員登録
                </Link>
              </li>
                </>
              ) : (
                <>
                  <li className="pt-2 border-t border-indigo-500 mt-2">
                    <Link 
                      href="/profile" 
                      prefetch={false}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-indigo-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="bg-indigo-800 p-1.5 rounded-full overflow-hidden w-8 h-8 flex items-center justify-center">
                        {session?.user?.image ? (
                          <img
                            src={session.user.image as string}
                            alt="アバター"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User size={18} className="text-white" />
                        )}
                      </div>
                      <span className="text-white font-medium">{session?.user?.name}</span>
                    </Link>
                  </li>
                  <li className="mt-2">
                    <button 
                      onClick={handleSignOut}
                      className="w-full block py-2 bg-white text-indigo-600 rounded px-3 transition-colors text-center font-medium"
                    >
                      ログアウト
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;