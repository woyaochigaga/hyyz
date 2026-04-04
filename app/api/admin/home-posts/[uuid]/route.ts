import { respData, respErr, respJson } from "@/lib/resp";
import {
  adminSoftDeleteHomePost,
  adminUpdateHomePost,
  findHomePostRowByUuid,
  validateHomePostPayload,
} from "@/models/home-post";
import { getUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getUserInfo();
  if (!admin?.email) {
    return { error: respJson(-2, "no auth") };
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim());
  if (!adminEmails?.includes(admin.email)) {
    return { error: respErr("No access") };
  }

  return { admin };
}

export async function PATCH(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const access = await requireAdmin();
    if (access.error) {
      return access.error;
    }

    const current = await findHomePostRowByUuid(params.uuid);
    if (!current) {
      return respErr("post not found");
    }

    const body = await req.json();
    const payload = validateHomePostPayload({
      ...current,
      ...body,
    });
    const post = await adminUpdateHomePost(params.uuid, payload);

    return respData(post);
  } catch (error: any) {
    console.error("admin update home post failed:", error);
    return respErr(error?.message || "update home post failed");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const access = await requireAdmin();
    if (access.error) {
      return access.error;
    }

    const current = await findHomePostRowByUuid(params.uuid);
    if (!current) {
      return respErr("post not found");
    }

    await adminSoftDeleteHomePost(params.uuid);
    return respData({ ok: true });
  } catch (error) {
    console.error("admin delete home post failed:", error);
    return respErr("delete home post failed");
  }
}
