import { redirect } from "next/navigation";

export const revalidate = 60;

export default async function ForumPostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  redirect(`/${params.locale}/home/forum?post=${params.id}`);
}
