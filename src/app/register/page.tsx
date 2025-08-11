'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SocialLoginButton from '../components/ui/SocialLoginButton';
import PasswordInput from '../components/ui/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 以前のAdmin特別処理を削除

  // フォームのバリデーションを行う関数
  const validateForm = () => {
    // ユーザー名のバリデーション
    const usernameRegex = /^[A-Za-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('ユーザー名は3〜30文字の英数字、アンダースコア、ハイフンのみ使用できます');
      return false;
    }

    // メールアドレスのバリデーション（Admin特別処理を削除）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }

    // パスワードのバリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }

    // パスワードの長さと英数字混在のバリデーション
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('パスワードは英数字が混在している8文字以上である必要があります');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // ボタンクリック時にのみバリデーションを実行
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('登録リクエスト送信:', formData.username);
      
      // リクエストデータの準備（Admin特別処理を削除）
      const requestData = {
        name: formData.username,
        email: formData.email, // 入力されたメールアドレスを使用
        password: formData.password, // 生のパスワードを送信（サーバーサイドでハッシュ化）
      };
      
      console.log('リクエストデータ:', JSON.stringify(requestData));
      
      // ユーザー登録APIを呼び出す（パスワードのハッシュ化はサーバーサイドで行う）
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // AJAXリクエストであることを明示
        },
        body: JSON.stringify(requestData),
        cache: 'no-store' // キャッシュを無効化
      });
      
      console.log('レスポンスステータス:', response.status);
      console.log('レスポンスヘッダー:', [...response.headers.entries()]);
      
      // レスポンスのContent-Typeをチェック - 緩和したチェック
      const contentType = response.headers.get('content-type');
      // Content-Typeチェックを一時的に無効化して、エラーの原因を特定
      if (false && !contentType) {
        console.error('不正なContent-Type:', contentType);
        throw new Error('サーバーからの応答が不正です。管理者にお問い合わせください。');
      }

      let data;
      try {
        // Content-Typeをチェックして適切な方法でレスポンスを処理
        const contentType = response.headers.get('content-type');
        console.log('レスポンスContent-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          // JSONレスポンスの場合
          data = await response.json();
        } else {
          // JSONでない場合はテキストとして取得してからパース試行
          const responseText = await response.text();
          console.log('レスポンステキスト:', responseText);
          
          // HTMLが返ってきた場合はエラーとして処理
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('HTMLレスポンスを受信:', responseText.substring(0, 100));
            throw new Error('サーバーエラーが発生しました。しばらく経ってからもう一度お試しください。');
          }
          
          // JSONとしてパース試行
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSONパースエラー:', parseError);
            throw new Error('レスポンスの解析に失敗しました。管理者にお問い合わせください。');
          }
        }
      } catch (jsonError) {
        console.error('レスポンス処理エラー:', jsonError);
        throw new Error('レスポンスの処理に失敗しました。管理者にお問い合わせください。');
      }

      if (!response.ok) {
        console.error('レスポンスエラー:', data);
        throw new Error(data.message || '登録中にエラーが発生しました');
      }
      
      // 成功レスポンスの確認
      if (!data || data.success === false) {
        console.error('レスポンスデータ異常:', data);
        throw new Error(data.message || 'レスポンスデータが不正です');
      }

      // 登録成功後、ログインページにリダイレクト
      router.push('/login?registered=true');
    } catch (error: any) {
      console.error('登録エラー:', error);
      // エラーメッセージの詳細を表示
      let errorMessage = '登録中にエラーが発生しました。もう一度お試しください。';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      setError(errorMessage);
      setIsLoading(false); // エラー時にローディング状態を解除
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          新規会員登録
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            ログイン
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 text-red-700 dark:text-red-400">
              <p>{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ユーザー名
              </label>
              <div className="mt-1">
                <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">3〜30文字の英数字、アンダースコア、ハイフンのみ使用できます。</p>
            </div>

            {/* メールアドレス入力欄（Admin特別処理を削除） */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">有効なメールアドレス形式で入力してください。</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                パスワード
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disableValidation={true}
                />
              </div>

            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                パスワード（確認）
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disableValidation={true}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">英数字が混在している8文字以上で設定してください。</p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登録中...' : '登録する'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">または</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <SocialLoginButton provider="google" label="Googleで登録" callbackUrl="/" />
              </div>

              <div>
                <SocialLoginButton provider="github" label="GitHubで登録" callbackUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}