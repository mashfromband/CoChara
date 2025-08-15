import Link from "next/link";

/**
 * エラーページ (/error)
 * NextAuth の pages.error でリダイレクトされる先。
 * クエリパラメータ `error` を読み取り、ユーザーにわかりやすいメッセージを表示します。
 * サーバーコンポーネントとして searchParams を受け取り、ビルド時のCSRバイアウト警告を回避します。
 */
export default async function ErrorPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Next.js 15: searchParams は Promise になるため await する
  const sp = (await searchParams) ?? undefined;

  // エラーコードを取得（未定義でも安全に扱う）
  const errorParam = sp?.error;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  // 代表的な NextAuth エラーコードをユーザ向けメッセージに変換
  const errorMessageMap: Record<string, string> = {
    Configuration: "認証設定に問題があります。管理者へお問い合わせください。",
    AccessDenied: "アクセスが拒否されました。権限をご確認ください。",
    Verification: "メール確認が必要です。メールをご確認ください。",
    OAuthSignin: "外部プロバイダへのサインインに失敗しました。時間を置いて再度お試しください。",
    OAuthCallback: "外部プロバイダからの応答に問題が発生しました。",
    OAuthAccountNotLinked:
      "このメールアドレスは既に別のプロバイダで登録されています。同じ方法でログインしてください。",
    EmailSignin: "メールサインインの送信に失敗しました。",
    CredentialsSignin: "ユーザー名またはパスワードが正しくありません。",
  };

  const fallbackMessage =
    "ログイン処理で問題が発生しました。しばらくしてから再度お試しください。";
  const message = errorCode
    ? errorMessageMap[errorCode] || fallbackMessage
    : fallbackMessage;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">エラーが発生しました</h1>
        <p className="text-gray-700">{message}</p>
        {errorCode && (
          <p className="text-sm text-gray-500">エラーコード: {errorCode}</p>
        )}
        <div className="pt-2 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ログインに戻る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ホームへ
          </Link>
        </div>
      </div>
    </div>
  );
}