import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

type LegacyGruposPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

export default async function LegacyGruposPage({ searchParams }: LegacyGruposPageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const status = Array.isArray(params?.status)
    ? params.status[0]
    : params?.status;
  redirect(status ? `/admin/grupos?status=${encodeURIComponent(status)}` : "/admin/grupos");
}
