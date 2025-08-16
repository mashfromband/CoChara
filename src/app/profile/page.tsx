import ProfileClient from './ProfileClient'

/**
 * ProfilePage
 * プロフィールページのサーバーコンポーネント。
 * クライアント機能（セッション、ローカルストレージ等）を含む表示は
 * クライアントコンポーネントである ProfileClient に委譲します。
 */
export default function Page() {
  return (
    <div>
      <ProfileClient />
    </div>
  )
}