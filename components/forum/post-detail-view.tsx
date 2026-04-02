"use client";

import { ForumPostDetail } from "@/types/forum";
import { ForumPostDetailSection } from "@/components/forum/post-detail-section";

export function ForumPostDetailView({
  locale,
  postId,
  initialDetail,
}: {
  locale: string;
  postId: string;
  initialDetail: ForumPostDetail;
}) {
  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(125,158,148,0.14),transparent_24%),linear-gradient(180deg,#f2f8f5_0%,#f4f6f5_40%,#edf2f0_100%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.2),transparent_26%),radial-gradient(circle_at_top_right,rgba(82,112,104,0.16),transparent_24%),linear-gradient(180deg,#121917_0%,#16201d_46%,#101715_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-4rem] h-56 w-56 rounded-full bg-[hsl(var(--primary)/0.18)] blur-3xl dark:bg-[hsl(var(--primary)/0.18)]" />
        <div className="absolute right-[-5%] top-[8rem] h-64 w-64 rounded-full bg-[rgba(121,161,148,0.22)] blur-3xl dark:bg-[rgba(86,126,114,0.28)]" />
        <div className="absolute bottom-[-6rem] left-[28%] h-56 w-56 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative w-full px-2 pb-10 pt-3 sm:px-3 lg:px-4">
        <ForumPostDetailSection
          locale={locale}
          postId={postId}
          initialDetail={initialDetail}
        />
      </div>
    </div>
  );
}
