import { respData, respErr } from "@/lib/resp";
import { findPublicUserProfileByUuid } from "@/models/user";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  const uuid = String(params.uuid || "").trim();
  if (!uuid) {
    return respErr("user not found");
  }

  const profile = await findPublicUserProfileByUuid(uuid);
  if (!profile) {
    return respErr("user not found");
  }

  return respData(profile);
}
