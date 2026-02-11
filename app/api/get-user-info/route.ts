import { respData, respErr, respJson } from "@/lib/resp";
import { logApi } from "@/lib/api-log";
import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";

export async function POST(req: Request) {
  const apiName = "get-user-info";

  try {
    logApi(apiName, "start");

    const user_uuid = await getUserUuid();
    logApi(apiName, "got-user-uuid", { user_uuid: !!user_uuid ? "exists" : "" });

    if (!user_uuid) {
      logApi(apiName, "no-auth");
      return respJson(-2, "no auth");
    }

    const user = await findUserByUuid(user_uuid);
    logApi(apiName, "db-user-result", { found: !!user });

    if (!user) {
      return respErr("user not exist");
    }

    logApi(apiName, "success");
    return respData(user);
  } catch (e) {
    logApi(apiName, "error", { error: String(e) });
    return respErr("get user info failed");
  }
}
