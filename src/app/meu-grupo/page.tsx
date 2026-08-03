import { redirect } from "next/navigation";
import { redirectIfResponsibleMesaServersIncomplete } from "@/lib/auth/require-mesa-servers";
import { requireAuthorizedSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function MyGroupPage() {
  const { access } = await requireAuthorizedSession();
  if (access.role === "administrador") redirect("/admin/grupos");
  await redirectIfResponsibleMesaServersIncomplete(access);
  const [group] = access.groups;
  if (!group) redirect("/login");
  redirect("/responsavel/atas");
}
