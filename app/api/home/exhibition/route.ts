import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import {
  createOfflineExhibition,
  listPublicOfflineExhibitionsCached,
  listOfflineExhibitions,
  validateOfflineExhibitionPayload,
} from "@/models/offline-exhibition";
import { getUserInfo, getUserUuid } from "@/services/user";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "1";
    const locale = String(searchParams.get("locale") || "").trim();
    const city = String(searchParams.get("city") || "").trim();
    const q = String(searchParams.get("q") || "").trim();
    const status = String(searchParams.get("status") || "").trim();
    const limit = Number.parseInt(String(searchParams.get("limit") || "24"), 10);
    const offset = Number.parseInt(String(searchParams.get("offset") || "0"), 10);
    const currentUserUuid = mine ? await getUserUuid() : "";
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 24;
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

    if (mine && !currentUserUuid) {
      return respJson(-2, "no auth");
    }

    if (!mine && !city && !q && !status && safeOffset === 0) {
      const exhibitions = await listPublicOfflineExhibitionsCached(
        locale,
        safeLimit
      );

      return respData({
        items: exhibitions,
        has_more: exhibitions.length >= safeLimit,
        next_offset: exhibitions.length,
      });
    }

    const exhibitions = await listOfflineExhibitions({
      currentUserUuid,
      locale,
      city,
      q,
      user_uuid: mine ? currentUserUuid : undefined,
      includeDraft: mine,
      includeDeleted: false,
      status:
        status === "draft" ||
        status === "pending_review" ||
        status === "published" ||
        status === "rejected" ||
        status === "closed"
          ? status
          : undefined,
      limit: safeLimit,
      offset: safeOffset,
      summaryOnly: !mine,
    });

    if (!mine) {
      return respData({
        items: exhibitions,
        has_more: exhibitions.length >= safeLimit,
        next_offset: safeOffset + exhibitions.length,
      });
    }

    return respData(exhibitions);
  } catch (error) {
    console.error("get offline exhibitions failed:", error);
    return respErr("get offline exhibitions failed");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserInfo();
    const user_uuid = user?.uuid || "";
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const payload = validateOfflineExhibitionPayload(body || {});
    if (payload.status === "published" && user?.role !== "admin") {
      return respErr("only admin can publish directly");
    }
    const exhibition = await createOfflineExhibition({
      uuid: getUuid(),
      user_uuid,
      ...payload,
    });

    return respData(exhibition);
  } catch (error: any) {
    console.error("create offline exhibition failed:", error);
    return respErr(error?.message || "create offline exhibition failed");
  }
}
