import { respData, respErr, respJson } from "@/lib/resp";
import { getUserInfo } from "@/services/user";
import { deleteUserByUuid } from "@/models/user";

// 管理员删除用户：POST /api/admin/users/delete
// body: { uuid: string }
export async function POST(req: Request) {
  try {
    const admin = await getUserInfo();
    if (!admin?.email) {
      return respJson(-2, "no auth");
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim());
    if (!adminEmails?.includes(admin.email)) {
      return respErr("No access");
    }

    const { uuid } = await req.json();
    const trimmed = String(uuid || "").trim();
    if (!trimmed) {
      return respErr("invalid uuid");
    }

    if (trimmed === admin.uuid) {
      return respErr("不能删除当前登录管理员");
    }

    await deleteUserByUuid(trimmed);
    return respData({ ok: true });
  } catch (e) {
    console.error("admin delete user failed:", e);
    return respErr("删除用户失败");
  }
}

