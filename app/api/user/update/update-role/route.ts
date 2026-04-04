import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { updateUserProfile } from "@/models/user";

// 修改账户类型：POST /api/user/update/update-role
// body: { role: "user" }
export async function POST(req: Request) {
  try {
    const { role } = await req.json();
    const value = String(role || "");

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    if (value !== "user") {
      if (value === "artisan") {
        return respErr("请通过匠人申请表单提交完整资料");
      }
      return respErr("无效的账户类型");
    }

    const updated = await updateUserProfile(user_uuid, {
      role: value,
    });

    return respData(updated?.[0] || { role: value });
  } catch (e) {
    console.error("update role failed:", e);
    return respErr("更新账户类型失败");
  }
}
