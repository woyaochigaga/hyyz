import AiChatView from "@/components/home/ai-chat-view";
import { getAiChatConversationsByUserUuid } from "@/models/ai-chat";
import { getUserInfo } from "@/services/user";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("home");
  const title = t("ai_chat.meta_title");
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    title,
    alternates: {
      canonical: `${canonicalUrl}/home/ai-chat`,
    },
  };
}

export default async function AiChatPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const user = await getUserInfo();
  const initialRemoteConversations = user?.uuid
    ? await getAiChatConversationsByUserUuid(user.uuid)
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <AiChatView
        locale={locale}
        initialUser={
          user?.uuid
            ? {
                uuid: user.uuid,
                nickname: String(user.nickname || "").trim() || "User",
                avatarUrl: String(user.avatar_url || "").trim(),
              }
            : null
        }
        initialRemoteConversations={initialRemoteConversations}
      />
    </div>
  );
}
