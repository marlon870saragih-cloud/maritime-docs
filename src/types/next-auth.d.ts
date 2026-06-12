import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    companyId: string;
    role: string;
  }
}
