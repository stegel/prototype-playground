import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getRedis } from "./redis";

interface CredentialsUser {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
}

interface UserMapping {
  designerFolder: string;
  email: string;
  name: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const redis = getRedis();
        if (!redis) return null;

        const user = await redis.get<CredentialsUser>(
          `user:credentials:${email}`
        );
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      // Look up designer folder from Redis on every token refresh
      if (token.sub) {
        const redis = getRedis();
        if (redis) {
          const mapping = await redis.get<UserMapping>(
            `user:mapping:${token.sub}`
          );
          token.designerFolder = mapping?.designerFolder ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.designerFolder = token.designerFolder as string | null;
      }
      return session;
    },
  },
});
