import { requireAdminSession } from "@/lib/auth/require-session";
import { GroupEditor } from "../group-editor";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  await requireAdminSession();
  return <GroupEditor horarios={[]} canCreate />;
}
