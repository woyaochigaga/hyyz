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

export async function GET(
  _req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const item = await findFeedbackItemByUuid(params.uuid);
  if (!item) return respErr("反馈不存在");
  return respData(item);
}

export async function PATCH(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const body = (await req.json()) as {
    action?: string;
    content?: string;
    contact?: string;
    status?: string;
    priority?: string;
    admin_note?: string;
  };

  const current = await findFeedbackItemByUuid(params.uuid);
  if (!current) {
    return respErr("反馈不存在");
  }

  const action = String(body.action || "").trim();
  if (
    action &&
    action !== "promote" &&
    action !== "start" &&
    action !== "resolve" &&
    action !== "close"
  ) {
    return respErr("无效的操作");
  }

  if (action === "promote") {
    const result = await updateFeedbackItem(params.uuid, {
      priority: "urgent",
      status: "in_progress",
    });
    if (!result) {
      return respErr("反馈不存在");
    }
    if (current.status === "new" && current.user_uuid) {
      await sendSystemMessage({
        title: "你的反馈已进入处理队列",
        content: "你的反馈已被提升优先级，管理员正在加快处理。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${result.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    }
    return respData(result);
  }

  if (action === "start") {
    const result = await updateFeedbackItem(params.uuid, {
      status: "in_progress",
    });
    if (!result) {
      return respErr("反馈不存在");
    }
    if (current.status === "new" && current.user_uuid) {
      await sendSystemMessage({
        title: "你的反馈开始处理",
        content: "管理员已开始处理你提交的问题或建议。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${result.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    }
    return respData(result);
  }

  if (action === "resolve") {
    const result = await updateFeedbackItem(params.uuid, {
      status: "resolved",
    });
    if (!result) {
      return respErr("反馈不存在");
    }
    if (current.status !== "resolved" && current.user_uuid) {
      await sendSystemMessage({
        title: "你的反馈已处理",
        content: "你提交的问题或建议已进入完成状态，可继续在 AI 聊天中补充新信息。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${result.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    }
    return respData(result);
  }

  if (action === "close") {
    const result = await updateFeedbackItem(params.uuid, {
      status: "closed",
    });
    if (!result) {
      return respErr("反馈不存在");
    }
    if (current.status !== "closed" && current.user_uuid) {
      await sendSystemMessage({
        title: "你的反馈已关闭",
        content: "该反馈已归档关闭，如仍需处理，请重新提交最新问题或补充信息。",
        category: "system",
        sender_uuid: access.admin.uuid,
        action_url: `/${result.locale || "zh"}/home/ai-chat`,
        audience_type: "direct",
        audience_value: current.user_uuid,
      });
    }
    return respData(result);
  }

  const content = String(body.content || "").trim();
  if (!content) {
    return respErr("反馈内容不能为空");
  }

  const result = await updateFeedbackItem(params.uuid, {
    content,
    contact: String(body.contact || "").trim(),
    status:
      body.status === "in_progress" ||
      body.status === "resolved" ||
      body.status === "closed"
        ? body.status
        : "new",
    priority:
      body.priority === "high" || body.priority === "urgent"
        ? body.priority
        : "normal",
    admin_note: String(body.admin_note || "").trim(),
  });

  if (!result) {
    return respErr("反馈不存在");
  }

  const statusChangedToInProgress =
    current.status === "new" && result.status === "in_progress";
  const statusChangedToResolved =
    current.status !== "resolved" && result.status === "resolved";
  const statusChangedToClosed =
    current.status !== "closed" && result.status === "closed";

  if (current.user_uuid && statusChangedToInProgress) {
    await sendSystemMessage({
      title: "你的反馈开始处理",
      content: "管理员已开始处理你提交的问题或建议。",
      category: "system",
      sender_uuid: access.admin.uuid,
      action_url: `/${result.locale || "zh"}/home/ai-chat`,
      audience_type: "direct",
      audience_value: current.user_uuid,
    });
  }

  if (current.user_uuid && (statusChangedToResolved || statusChangedToClosed)) {
    await sendSystemMessage({
      title: statusChangedToResolved ? "你的反馈已处理" : "你的反馈已关闭",
      content: statusChangedToResolved
        ? "你提交的问题或建议已进入完成状态，可继续在 AI 聊天中补充新信息。"
        : "该反馈已归档关闭，如仍需处理，请重新提交最新问题或补充信息。",
      category: "system",
      sender_uuid: access.admin.uuid,
      action_url: `/${result.locale || "zh"}/home/ai-chat`,
      audience_type: "direct",
      audience_value: current.user_uuid,
    });
  }

  return respData(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  await deleteFeedbackItem(params.uuid);
  return respOk();
}
