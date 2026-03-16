import { respData, respErr, respJson } from "@/lib/resp";
import { logApi } from "@/lib/api-log";
import { getUserUuid } from "@/services/user";
import { updateUserNickname } from "@/models/user";

// 修改当前登录用户昵称：POST /api/user/update/update-nickname
// body: { nickname: string }
export async function POST(req: Request) {
  const apiName = "update-nickname";

  try {
    logApi(apiName, "start");

    const { nickname } = await req.json();
    logApi(apiName, "request-body", {
      nickname_preview: nickname ? String(nickname).slice(0, 10) : "",
    });

    // 1. 参数校验
    if (!nickname || !String(nickname).trim()) {
      return respErr("昵称不能为空");
    }
    const trimmed = String(nickname).trim();
    if (trimmed.length > 50) {
      return respErr("昵称长度不能超过 50 个字符");
    }

    // 2. 认证：必须登录
    const user_uuid = await getUserUuid();
    logApi(apiName, "got-user-uuid", { hasUser: !!user_uuid });
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    // 3. 更新数据库
    await updateUserNickname(user_uuid, trimmed);
    logApi(apiName, "db-updated", { user_uuid });

    // 4. 返回成功
    logApi(apiName, "success");
    return respData({ nickname: trimmed });
  } catch (e: any) {
    logApi(apiName, "error", { error: String(e) });
    console.error("update nickname failed:", e);
    return respErr("更新昵称失败");
  }
}

