import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";
import { PersonalProfile } from "@/components/console/personal/profile";

export default async function () {
  const user = await getUserInfo();

  if (!user || !user.email) {
    const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/personal_center`;
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <PersonalProfile user={user} />;
}
