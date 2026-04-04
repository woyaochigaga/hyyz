import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import { sendSystemMessage } from "@/models/notification";
import { Form as FormSlotType } from "@/types/slots/form";
import { getUserInfo } from "@/services/user";

export default async function AdminNotificationAddPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const user = await getUserInfo();
  if (!user?.uuid || !user?.email) {
    return <Empty message="请先登录" />;
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((item) => item.trim());
  if (!adminEmails?.includes(user.email)) {
    return <Empty message="无权限访问" />;
  }

  const form: FormSlotType = {
    title: "发送系统消息",
    crumb: {
      items: [
        {
          title: "消息中心",
          url: `/${locale}/admin/notifications`,
        },
        {
          title: "发送消息",
          is_active: true,
        },
      ],
    },
    fields: [
      {
        name: "title",
        title: "标题",
        type: "text",
        placeholder: "例如：本周系统维护通知",
        validation: {
          required: true,
        },
      },
      {
        name: "content",
        title: "内容",
        type: "textarea",
        placeholder: "请输入消息内容",
        attributes: {
          rows: 6,
        },
      },
      {
        name: "category",
        title: "分类",
        type: "select",
        value: "system",
        options: [
          { title: "系统", value: "system" },
          { title: "互动", value: "interaction" },
          { title: "审核", value: "review" },
        ],
      },
      {
        name: "audience_type",
        title: "发送范围",
        type: "select",
        value: "all",
        options: [
          { title: "全部用户", value: "all" },
          { title: "指定角色", value: "role" },
          { title: "指定用户", value: "direct" },
        ],
      },
      {
        name: "audience_value",
        title: "发送对象",
        type: "text",
        placeholder: "role 填 user/artisan/admin，direct 填用户 UUID，all 留空",
      },
      {
        name: "action_url",
        title: "跳转链接",
        type: "text",
        placeholder: "例如：/zh/home/community",
      },
      {
        name: "priority",
        title: "优先级",
        type: "select",
        value: "normal",
        options: [
          { title: "普通", value: "normal" },
          { title: "高", value: "high" },
          { title: "低", value: "low" },
        ],
      },
    ],
    submit: {
      button: {
        title: "发送",
      },
      handler: async (data: FormData) => {
        "use server";

        const title = String(data.get("title") || "").trim();
        const content = String(data.get("content") || "").trim();
        const category = String(data.get("category") || "system").trim();
        const audience_type = String(data.get("audience_type") || "all").trim();
        const audience_value = String(data.get("audience_value") || "").trim();
        const action_url = String(data.get("action_url") || "").trim();
        const priority = String(data.get("priority") || "normal").trim();

        if (!title) {
          throw new Error("标题不能为空");
        }

        if (!["all", "role", "direct"].includes(audience_type)) {
          throw new Error("发送范围无效");
        }

        if (audience_type !== "all" && !audience_value) {
          throw new Error("请填写发送对象");
        }

        await sendSystemMessage({
          title,
          content,
          category:
            category === "interaction" || category === "review"
              ? category
              : "system",
          sender_uuid: user.uuid,
          action_url,
          audience_type: audience_type as "all" | "role" | "direct",
          audience_value,
          priority:
            priority === "high" || priority === "low" ? priority : "normal",
        });

        return {
          status: "success",
          message: "系统消息已发送",
          redirect_url: `/${locale}/admin/notifications`,
        };
      },
    },
  };

  return <FormSlot {...form} />;
}
