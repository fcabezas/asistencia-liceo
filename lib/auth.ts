import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const schoolDomain = process.env.SCHOOL_GOOGLE_HD;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: { hd: schoolDomain },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email ?? "";
      const domain = email.split("@")[1];
      // The `hd` param is only a UX hint; the domain must be re-checked here server-side.
      if (!schoolDomain || domain !== schoolDomain) {
        return false;
      }
      if (!profile?.sub) {
        return false;
      }

      // The Workspace domain can be shared across multiple schools (e.g. a
      // whole SLEP), so matching the domain alone isn't enough to scope
      // access to this school. A user row must be pre-created by an admin
      // (with a "pending:" googleSub placeholder) before anyone can sign in;
      // there is no auto-provisioning on first login.
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!existing) {
        return false;
      }
      if (!existing.isActive) {
        return false;
      }
      if (existing.googleSub !== profile.sub) {
        await db
          .update(users)
          .set({ googleSub: profile.sub })
          .where(eq(users.id, existing.id));
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = token.role ?? "teacher";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
