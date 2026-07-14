import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { isAppEmailAllowed } from "@/lib/auth/access";
import { validateGroupCredentials } from "@/lib/sheets/group-users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string" ? credentials.email : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        const user = await validateGroupCredentials(email, password);
        if (!user) return null;
        return { id: user.usuario_id, email: user.email, name: user.nome };
      },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") return isAppEmailAllowed(user.email);
      return isAppEmailAllowed(user.email);
    },
    async authorized({ auth: session }) {
      return isAppEmailAllowed(session?.user?.email);
    },
  },
});
