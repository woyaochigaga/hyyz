import AiChatView from "@/components/home/ai-chat-view";
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
  return <AiChatView locale={locale} />;
}
