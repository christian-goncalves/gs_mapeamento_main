import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isEmailAllowed } from "./allowed-emails";

export async function requireAuthorizedSession() {
  const session = await auth();
  if (!session || !isEmailAllowed(session.user?.email)) redirect("/login");
  return session;
}
