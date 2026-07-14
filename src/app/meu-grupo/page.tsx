import { redirect } from "next/navigation";
import { requireAuthorizedSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function MyGroupPage() {
  const { access } = await requireAuthorizedSession();
  if (access.role === "administrador") redirect("/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");
  redirect(`/grupos/${group.grupo_id}`);
}
