import { notFound } from "next/navigation";
import { OfflineExhibitionDetailView } from "@/components/home/offline-exhibition-detail-view";
import { findOfflineExhibitionByUuid } from "@/models/offline-exhibition";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function ExhibitionDetailPage({
  params,
}: {
  params: { locale: string; uuid: string };
}) {
  const currentUserUuid = await getUserUuid();
  const item = await findOfflineExhibitionByUuid(params.uuid, currentUserUuid);

  if (!item || item.status === "deleted") {
    notFound();
  }

  return (
    <OfflineExhibitionDetailView
      locale={params.locale}
      uuid={params.uuid}
      initialItem={item}
    />
  );
}
