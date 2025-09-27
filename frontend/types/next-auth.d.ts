import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    googleAccessToken?: string
    user: {
      email: string
      name: string
      image?: string
    }
  }

  interface JWT {
    googleAccessToken?: string
    email?: string
    name?: string
    picture?: string
  }
}