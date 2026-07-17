import { requireAdminSession } from "@/lib/auth/require-session";
import { GroupEditor } from "@/app/grupos/group-editor";

export const dynamic = "force-dynamic";

export default async function NewAdminGroupPage() {
  await requireAdminSession();
  return <GroupEditor horarios={[]} canCreate />;
}
