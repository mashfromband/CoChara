import { createClient } from '@supabase/supabase-js';

/**
 * Supabaseクライアントの初期化
 * クライアントサイドで使用するための公開キーを使用
 */
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase環境変数が設定されていません');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};