import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { role?: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
