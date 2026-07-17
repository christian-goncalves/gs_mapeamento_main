import { signOut } from "@/auth";
import { requireAdminSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminSession();
  await signOut({ redirectTo: "/login" });
  return new Response(null, { status: 204 });
}
