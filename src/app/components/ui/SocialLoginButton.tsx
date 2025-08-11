'use client';

import { signIn } from 'next-auth/react';

type SocialLoginButtonProps = {
  provider: 'google' | 'github';
  label: string;
  callbackUrl?: string;
};

/**
 * ソーシャルログインボタンコンポーネント
 * Google または GitHub でのログイン/登録に使用するボタンを表示します
 */
const SocialLoginButton = ({ provider, label, callbackUrl = '/' }: SocialLoginButtonProps) => {
  // プロバイダーに応じたアイコンを表示
  const renderIcon = () => {
    if (provider === 'google') {
      return (
        <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 3.573-5.347 3.573-9.13 0-.92-.107-1.92-.4-2.667H12.48z" />
        </svg>
      );
    } else if (provider === 'github') {
      return (
        <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  // ソーシャルログイン処理
  const handleSocialLogin = () => {
    signIn(provider, { callbackUrl });
  };

  return (
    <button
      onClick={handleSocialLogin}
      className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      {renderIcon()}
      <span className="ml-2">{label}</span>
    </button>
  );
};

export default SocialLoginButton;