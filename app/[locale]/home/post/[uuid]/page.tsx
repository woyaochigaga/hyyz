import { PostDetailView } from "@/components/home/post-detail-view";

export default function Page({
  params,
}: {
  params: { locale: string; uuid: string };
}) {
  return <PostDetailView locale={params.locale} uuid={params.uuid} />;
}
