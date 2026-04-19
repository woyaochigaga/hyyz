import { respData, respErr, respJson } from "@/lib/resp";
import { listFeedbackItemsForAdmin } from "@/models/feedback";
import { getUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getUserInfo();
  if (!admin?.email) {
    return { error: respJson(-2, "no auth") };
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((item) => item.trim());
  if (!adminEmails?.includes(admin.email)) {
    return { error: respErr("No access") };
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
