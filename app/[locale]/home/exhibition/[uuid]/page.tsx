import { OfflineExhibitionDetailView } from "@/components/home/offline-exhibition-detail-view";

export default function ExhibitionDetailPage({
  params,
}: {
  params: { locale: string; uuid: string };
}) {
  return <OfflineExhibitionDetailView locale={params.locale} uuid={params.uuid} />;
}
