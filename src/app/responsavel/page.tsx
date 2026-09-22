import { redirect } from "next/navigation";
import { requireAuthorizedSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function ResponsavelPage() {
  const { access } = await requireAuthorizedSession();
  redirect(access.role === "administrador" ? "/admin/grupos" : "/responsavel/atas");
}
