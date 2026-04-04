import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ForumPostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  redirect(`/${params.locale}/home/forum?post=${encodeURIComponent(params.id)}`);
}
