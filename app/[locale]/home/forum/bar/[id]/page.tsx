import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ForumBarPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  redirect(`/${params.locale}/home/forum?bar=${params.id}`);
}
