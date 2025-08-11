import NextAuth from "next-auth"

declare module "next-auth" {
  /**
   * セッションのユーザー型を拡張して、idプロパティを追加
   */
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  /** JWT型を拡張 */
  interface JWT {
    id?: string
  }
}