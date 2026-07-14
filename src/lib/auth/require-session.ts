import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessGroup, resolveAccessByEmail } from "./access";

export async function requireAuthorizedSession() {
  const session = await auth();
  const access = await resolveAccessByEmail(session?.user?.email);
  if (!session || !access) redirect("/login");
  return { session, access };
}

export async function requireAdminSession() {
  const current = await requireAuthorizedSession();
  if (current.access.role !== "administrador") redirect("/");
  return current;
}

export async function requireGroupSession(grupoId: string) {
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");
  return current;
}
