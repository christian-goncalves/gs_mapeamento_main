import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";

export default async function LoginPage() {
  const session = await auth();
  if (isEmailAllowed(session?.user?.email)) redirect("/");

  return (
    <main className="login">
      <section className="card">
        <h1>GS Mapeamento</h1>
        <p className="muted">Entre com uma conta Google autorizada.</p>
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
          <button type="submit">Entrar com Google</button>
        </form>
      </section>
    </main>
  );
}
