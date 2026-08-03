import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import {
  canAccessGroup,
  resolveAccessByEmail,
  resolveAccessByEmailFromAggregated,
} from "./access";

export async function requireAuthorizedSession() {
  const session = await auth();
  const access = await resolveAccessByEmail(session?.user?.email);
  if (!session || !access) redirect("/login");
  return { session, access };
}

export async function requireAuthorizedSessionWithAggregatedAtas() {
  const session = await auth();
  if (!session) redirect("/login");
  const result = await readAggregatedAtas();
  const access = await resolveAccessByEmailFromAggregated(
    session.user?.email,
    result,
  );
  if (!access) redirect("/login");
  return { session, access, result };
}

export async function requireAdminSessionWithAggregatedAtas() {
  const current = await requireAuthorizedSessionWithAggregatedAtas();
  if (current.access.role !== "administrador") redirect("/");
  return current;
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

export async function requireGroupSessionWithAggregatedAtas(grupoId: string) {
  const current = await requireAuthorizedSessionWithAggregatedAtas();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");
  return current;
}
