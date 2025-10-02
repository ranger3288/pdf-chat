import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Get allowed test user emails from environment variable
const getAllowedTestUsers = (): string[] => {
  const allowedUsers = process.env.ALLOWED_TEST_USERS
  if (!allowedUsers) {
    console.warn('ALLOWED_TEST_USERS environment variable not set. No users will be allowed to sign in.')
    return []
  }
  return allowedUsers.split(',').map(email => email.trim().toLowerCase())
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow sign in for test users
      if (account?.provider === 'google' && profile?.email) {
        const allowedUsers = getAllowedTestUsers()
        const userEmail = profile.email.toLowerCase()
        
        if (allowedUsers.length === 0) {
          console.error('No allowed test users configured. Blocking sign in.')
          return false
        }
        
        if (!allowedUsers.includes(userEmail)) {
          console.warn(`Sign in blocked for unauthorized user: ${userEmail}`)
          return false
        }
        
        console.log(`Sign in allowed for test user: ${userEmail}`)
        return true
      }
      
      return false
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.googleAccessToken = account.access_token
        token.email = profile.email
        token.name = profile.name
        token.picture = (profile as any).picture
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.googleAccessToken = token.googleAccessToken as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/?error=AccessDenied',
  },
})