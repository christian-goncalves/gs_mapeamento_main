import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { isEmailAllowed } from "@/lib/auth/allowed-emails";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ user }) {
      return isEmailAllowed(user.email);
    },
    authorized({ auth: session }) {
      return isEmailAllowed(session?.user?.email);
    },
  },
});
