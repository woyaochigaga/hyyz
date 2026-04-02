import { respData, respErr, respJson } from "@/lib/resp";
import {
  findOfflineExhibitionByUuid,
  softDeleteOfflineExhibition,
  updateOfflineExhibition,
  validateOfflineExhibitionPayload,
} from "@/models/offline-exhibition";
import { getUserInfo, getUserUuid } from "@/services/user";

export async function GET(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const currentUserUuid = await getUserUuid();
    const exhibition = await findOfflineExhibitionByUuid(
      params.uuid,
      currentUserUuid
    );

    if (!exhibition || exhibition.status === "deleted") {
      return respErr("exhibition not found");
    }

    return respData(exhibition);
  } catch (error) {
    console.error("get offline exhibition failed:", error);
    return respErr("get offline exhibition failed");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const user = await getUserInfo();
    const user_uuid = user?.uuid || "";
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const current = await findOfflineExhibitionByUuid(params.uuid, user_uuid);
    if (!current || current.user_uuid !== user_uuid) {
      return respErr("no permission");
    }

    const body = await req.json();
    const payload = validateOfflineExhibitionPayload({
      ...current,
      ...body,
    });
    if (payload.status === "published" && user?.role !== "admin") {
      return respErr("only admin can publish directly");
    }
    const exhibition = await updateOfflineExhibition(params.uuid, user_uuid, payload);

    return respData(exhibition);
  } catch (error: any) {
    console.error("update offline exhibition failed:", error);
    return respErr(error?.message || "update offline exhibition failed");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const current = await findOfflineExhibitionByUuid(params.uuid, user_uuid);
    if (!current || current.user_uuid !== user_uuid) {
      return respErr("no permission");
    }

    await softDeleteOfflineExhibition(params.uuid, user_uuid);
    return respData({ ok: true });
  } catch (error) {
    console.error("delete offline exhibition failed:", error);
    return respErr("delete offline exhibition failed");
  }
}
