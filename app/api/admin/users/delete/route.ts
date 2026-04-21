import { respData, respErr, respJson } from "@/lib/resp";
import { getAdminUserInfo } from "@/services/user";
import { deleteUserByUuid } from "@/models/user";

// 管理员删除用户：POST /api/admin/users/delete
// body: { uuid: string }
export async function POST(req: Request) {
  try {
    const admin = await getAdminUserInfo();
    if (!admin?.uuid) {
      return respJson(-2, "no auth");
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
