import { OfflineExhibitionHub } from "@/components/home/offline-exhibition-hub";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function MyExhibitionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const user = await getUserInfo();

  if (!user || !user.email) {
    const callbackUrl =
      locale === "en"
        ? `${process.env.NEXT_PUBLIC_WEB_URL}/my-exhibitions`
        : `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/my-exhibitions`;
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <OfflineExhibitionHub locale={locale} userRole={user.role || "user"} />;
}
