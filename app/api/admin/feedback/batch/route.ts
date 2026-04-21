import { respData, respErr, respJson, respOk } from "@/lib/resp";
import {
  deleteFeedbackItem,
  findFeedbackItemByUuid,
  updateFeedbackItem,
} from "@/models/feedback";
import { sendSystemMessage } from "@/models/notification";
import { getAdminUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getAdminUserInfo();
  if (!admin?.uuid) {
    return { error: respJson(-2, "no auth") };
  }

  return { admin };
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const body = (await req.json()) as {
    action?: string;
    ids?: string[];
  };

  const action = String(body.action || "").trim();
  const ids = Array.isArray(body.ids)
    ? body.ids.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!action || ids.length === 0) {
    return respErr("参数不完整");
  }
  if (
    action !== "promote" &&
    action !== "start" &&
    action !== "resolve" &&
    action !== "close" &&
    action !== "delete"
  ) {
    return respErr("无效的操作");
  }

  const results = [];

  for (const uuid of ids) {
    const current = await findFeedbackItemByUuid(uuid);
    if (!current) continue;

    if (action === "delete") {
      await deleteFeedbackItem(uuid);
      continue;
    }

    let next =
      action === "promote"
        ? await updateFeedbackItem(uuid, {
            priority: "urgent",
            status: "in_progress",
          })
        : action === "start"
          ? await updateFeedbackItem(uuid, {
              status: "in_progress",
            })
          : action === "resolve"
            ? await updateFeedbackItem(uuid, {
                status: "resolved",
              })
            : action === "close"
              ? await updateFeedbackItem(uuid, {
                  status: "closed",
                })
              : null;

    if (!next) continue;
    results.push(next);

    const statusChangedToResolved =
      current.status !== "resolved" && next.status === "resolved";
    const statusChangedToClosed =
      current.status !== "closed" && next.status === "closed";

    if (current.user_uuid && (statusChangedToResolved || statusChangedToClosed)) {
      await sendSystemMessage({
        title: statusChangedToResolved ? "你的反馈已处理" : "你的反馈已关闭",
        content: statusChangedToResolved
          ? "你提交的问题或建议已进入完成状态，可继续在 AI 聊天中补充新信息。"
          : "该反馈已归档关闭，如仍需处理，请重新提交最新问题或补充信息。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${next.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    } else if (current.user_uuid && current.status === "new" && next.status === "in_progress") {
      await sendSystemMessage({
        title: action === "promote" ? "你的反馈已进入处理队列" : "你的反馈开始处理",
        content:
          action === "promote"
            ? "你的反馈已被提升优先级，管理员正在加快处理。"
            : "管理员已开始处理你提交的问题或建议。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${next.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    }
  }

  if (action === "delete") {
    return respOk();
  }

  return respData(results);
}
