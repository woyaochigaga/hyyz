import Link from "next/link";

import { PublicUserProfilePanel } from "@/components/user/public-profile-dialog";
import { findPublicUserProfileByUuid } from "@/models/user";
import { listHomePosts } from "@/models/home-post";
import { listForumPostsByAuthorId } from "@/models/forum";
import { listOfflineExhibitions } from "@/models/offline-exhibition";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white/75 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
      {text}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-zinc-200/80 bg-white/85 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function PublicUserProfilePage({
  params: { locale, uuid },
}: {
  params: { locale: string; uuid: string };
}) {
  const profile = await findPublicUserProfileByUuid(uuid);

  if (!profile) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[30px] border border-dashed border-zinc-200 bg-white/75 dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          未找到该用户
        </h1>
        <Link
          href={`/${locale}/home`}
          className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          返回云展首页
        </Link>
      </div>
    );
  }

  const [homePosts, forumPosts, exhibitions] = await Promise.all([
    listHomePosts({
      locale,
      user_uuid: uuid,
      limit: 8,
      summaryOnly: true,
    }),
    listForumPostsByAuthorId(uuid, undefined, 8),
    listOfflineExhibitions({
      locale,
      user_uuid: uuid,
      limit: 8,
      summaryOnly: true,
    }),
  ]);

  return (
    <div className="flex min-h-full w-full min-w-0 max-w-none flex-col gap-6 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#f4f8f6_0%,#edf3f0_100%)] px-1 py-2 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#111615_0%,#0f1413_100%)]">
      <PublicUserProfilePanel
        profile={profile}
        locale={locale}
        actionSlot={
          <>
            <Link
              href={`/${locale}/home/community`}
              className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              去社区
            </Link>
            <Link
              href={`/${locale}/home/forum`}
              className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-100 px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15"
            >
              去论坛
            </Link>
            <Link
              href={`/${locale}/home/exhibition`}
              className="inline-flex h-9 items-center justify-center rounded-full bg-zinc-100 px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15"
            >
              看展览
            </Link>
          </>
        }
      />

      <Section
        title="社区帖子"
        description="最近发布的社区内容。"
      >
        {homePosts.length > 0 ? (
          <div className="space-y-3">
            {homePosts.map((post) => (
              <Link
                key={post.uuid}
                href={`/${locale}/home/post/${post.uuid}`}
                className="block rounded-[22px] border border-zinc-200/80 bg-zinc-50/75 px-4 py-4 transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/15 dark:hover:bg-white/[0.05]"
              >
                <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {post.title || "未命名帖子"}
                </div>
                <div className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {post.excerpt || post.content}
                </div>
                <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(post.created_at)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock text="还没有公开社区帖子" />
        )}
      </Section>

      <Section
        title="论坛发帖"
        description="最近参与的论坛讨论。"
      >
        {forumPosts.length > 0 ? (
          <div className="space-y-3">
            {forumPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/home/forum/post/${encodeURIComponent(post.id)}`}
                className="block rounded-[22px] border border-zinc-200/80 bg-zinc-50/75 px-4 py-4 transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/15 dark:hover:bg-white/[0.05]"
              >
                <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {post.title || "未命名论坛帖"}
                </div>
                <div className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {post.content}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{post.bar?.name || "论坛"}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock text="还没有公开论坛发帖" />
        )}
      </Section>

      <Section
        title="线下展览"
        description="已公开发布的线下展览或活动。"
      >
        {exhibitions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {exhibitions.map((item) => (
              <Link
                key={item.uuid}
                href={`/${locale}/home/exhibition/${item.uuid}`}
                className="block rounded-[22px] border border-zinc-200/80 bg-zinc-50/75 px-4 py-4 transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/15 dark:hover:bg-white/[0.05]"
              >
                <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title || "未命名展览"}
                </div>
                <div className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {item.summary || item.description || "暂无介绍"}
                </div>
                <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.venue_name || item.formatted_address || "地点待补充"}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock text="还没有已发布的线下展览" />
        )}
      </Section>
    </div>
  );
}
