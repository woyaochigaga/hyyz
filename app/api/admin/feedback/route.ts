import { respData, respErr, respJson } from "@/lib/resp";
import { listFeedbackItemsForAdmin } from "@/models/feedback";
import { getAdminUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getAdminUserInfo();
  if (!admin?.uuid) {
    return { error: respJson(-2, "no auth") };
  }

  return { admin };
}

export async function GET(req: Request) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 100);
  const items = await listFeedbackItemsForAdmin(limit > 0 ? limit : 100);
  return respData(items);
}
