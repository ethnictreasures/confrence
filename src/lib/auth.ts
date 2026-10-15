import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { admins, type AdminRole } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function isAdminRole(role: unknown): role is AdminRole {
  return role === 'admin' || role === 'super_admin';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const [admin] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email))
          .limit(1);

        if (!admin) return null;

        if (!admin.isActive) return null;

        const passwordsMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!passwordsMatch) return null;

        if (!isAdminRole(admin.role)) return null;

        await db
          .update(admins)
          .set({ lastLoginAt: new Date() })
          .where(eq(admins.id, admin.id));

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (isAdminRole(user.role)) {
          token.id = user.id;
          token.role = user.role;
        } else {
          delete token.id;
          delete token.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') {
          session.user.id = token.id;
        }

        if (isAdminRole(token.role)) {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
});
