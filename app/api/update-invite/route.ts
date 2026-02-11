import {
  AffiliateRewardAmount,
  AffiliateRewardPercent,
  AffiliateStatus,
} from "@/services/constant";
import {
  findUserByInviteCode,
  findUserByUuid,
  updateUserInvitedBy,
} from "@/models/user";
import { respData, respErr } from "@/lib/resp";

import { getIsoTimestr } from "@/lib/time";
import { insertAffiliate } from "@/models/affiliate";
import { logApi } from "@/lib/api-log";

export async function POST(req: Request) {
  const apiName = "update-invite";

  try {
    const { invite_code, user_uuid } = await req.json();
    logApi(apiName, "request-body", {
      invite_code: !!invite_code ? "provided" : "",
      user_uuid: !!user_uuid ? "provided" : "",
    });

    if (!invite_code || !user_uuid) {
      return respErr("invalid params");
    }

    // check invite user
    const inviteUser = await findUserByInviteCode(invite_code);
    logApi(apiName, "invite-user-db-result", { found: !!inviteUser });
    if (!inviteUser) {
      return respErr("invite user not found");
    }

    // check current user
    const user = await findUserByUuid(user_uuid);
    logApi(apiName, "current-user-db-result", { found: !!user });
    if (!user) {
      return respErr("user not found");
    }

    if (user.uuid === inviteUser.uuid || user.email === inviteUser.email) {
      return respErr("can't invite yourself");
    }

    if (user.invited_by) {
      return respErr("user already has invite user");
    }

    user.invited_by = inviteUser.uuid;

    // update invite user uuid
    await updateUserInvitedBy(user_uuid, inviteUser.uuid);
    logApi(apiName, "update-user-invited-by-ok", {
      user_uuid,
      invited_by: inviteUser.uuid,
    });

    await insertAffiliate({
      user_uuid: user_uuid,
      invited_by: inviteUser.uuid,
      created_at: getIsoTimestr(),
      status: AffiliateStatus.Pending,
      paid_order_no: "",
      paid_amount: 0,
      reward_percent: AffiliateRewardPercent.Invited,
      reward_amount: AffiliateRewardAmount.Invited,
    });
    logApi(apiName, "insert-affiliate-ok", {
      user_uuid,
      invited_by: inviteUser.uuid,
    });

    logApi(apiName, "success");
    return respData(user);
  } catch (e) {
    logApi(apiName, "error", { error: String(e) });
    return respErr("update invited by failed");
  }
}

