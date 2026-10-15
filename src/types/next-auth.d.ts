import 'next-auth';
import 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';
import type { AdminRole } from '@/db/schema';

declare module 'next-auth' {
  interface User {
    role: AdminRole;
  }

  interface Session {
    user: { id?: string; role?: AdminRole } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: AdminRole;
  }
}
