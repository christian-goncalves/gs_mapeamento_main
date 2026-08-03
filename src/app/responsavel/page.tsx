import { redirect } from "next/navigation";
import { redirectIfResponsibleMesaServersIncomplete } from "@/lib/auth/require-mesa-servers";
import { requireAuthorizedSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function ResponsavelPage() {
  const { access } = await requireAuthorizedSession();
  await redirectIfResponsibleMesaServersIncomplete(access);
  redirect(access.role === "administrador" ? "/admin/grupos" : "/responsavel/atas");
}
