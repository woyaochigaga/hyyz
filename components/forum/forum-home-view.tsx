"use client";

import * as React from "react";
import { toast } from "sonner";
import { Home, Plus, Users } from "lucide-react";
import { ForumBar, ForumPost, ForumPostDetail } from "@/types/forum";
import { ForumPostCard } from "@/components/forum/post-card";
import { ForumBarDetailSection } from "@/components/forum/bar-detail-section";
import { ForumPostDetailSection } from "@/components/forum/post-detail-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

function barInitial(name: string) {
  return String(name || "").trim().slice(0, 1) || "?";
}

export function ForumHomeView({
  locale,
  initialBars,
  initialPosts,
  followingBarIds,
  initialBarId = "",
  initialPostId = "",
}: {
  locale: string;
  initialBars: ForumBar[];
  initialPosts: ForumPost[];
  followingBarIds: string[];
  initialBarId?: string;
  initialPostId?: string;
}) {
  const isZh = locale.startsWith("zh");
  const [bars, setBars] = React.useState(initialBars);
  const [posts, setPosts] = React.useState(initialPosts);
  const [view, setView] = React.useState<"home" | "bar" | "post">(
    initialPostId ? "post" : initialBarId ? "bar" : "home"
  );
  const [activeBarId, setActiveBarId] = React.useState(initialBarId);
  const [activePostId, setActivePostId] = React.useState(initialPostId);
  const [activeBarDetail, setActiveBarDetail] = React.useState<{
    bar: ForumBar;
    posts: ForumPost[];
  } | null>(null);
  const [activePostDetail, setActivePostDetail] =
    React.useState<ForumPostDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState("");
  const [postReturnBarId, setPostReturnBarId] = React.useState("");

  const [selectedBarId, setSelectedBarId] = React.useState(
    initialBarId || followingBarIds[0] || initialBars[0]?.id || ""
  );
  const [postTitle, setPostTitle] = React.useState("");
  const [postContent, setPostContent] = React.useState("");

  const [barName, setBarName] = React.useState("");
  const [barDescription, setBarDescription] = React.useState("");
  const [barCover, setBarCover] = React.useState("");

  const [submittingPost, setSubmittingPost] = React.useState(false);
  const [submittingBar, setSubmittingBar] = React.useState(false);
  const [followingBarId, setFollowingBarId] = React.useState("");
  const [postDialogOpen, setPostDialogOpen] = React.useState(false);
  const leftBarsNavRef = React.useRef<HTMLElement | null>(null);
  const leftBarItemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [leftBarIndicator, setLeftBarIndicator] = React.useState({
    top: 0,
    height: 0,
    opacity: 0,
  });

  React.useEffect(() => {
    if (!selectedBarId && bars[0]?.id) setSelectedBarId(bars[0].id);
  }, [bars, selectedBarId]);

  React.useEffect(() => {
    const syncSelectedBarFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#bar-card-")) return;
      const barId = decodeURIComponent(hash.slice("#bar-card-".length));
      if (barId && bars.some((bar) => bar.id === barId)) {
        setSelectedBarId(barId);
      }
    };

    syncSelectedBarFromHash();
    window.addEventListener("hashchange", syncSelectedBarFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSelectedBarFromHash);
    };
  }, [bars]);

  React.useEffect(() => {
    const syncIndicator = () => {
      const nav = leftBarsNavRef.current;
      const activeItem = leftBarItemRefs.current[selectedBarId];

      if (!nav || !activeItem) {
        setLeftBarIndicator((current) =>
          current.opacity === 0 ? current : { ...current, opacity: 0 }
        );
        return;
      }

      setLeftBarIndicator({
        top: activeItem.offsetTop,
        height: activeItem.offsetHeight,
        opacity: 1,
      });
    };

    syncIndicator();

    const nav = leftBarsNavRef.current;
    if (!nav) return;

    const resizeObserver = new ResizeObserver(syncIndicator);
    resizeObserver.observe(nav);

    const activeItem = leftBarItemRefs.current[selectedBarId];
    if (activeItem) resizeObserver.observe(activeItem);

    window.addEventListener("resize", syncIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncIndicator);
    };
  }, [bars, selectedBarId]);

  const syncHistoryState = React.useCallback(
    (nextView: "home" | "bar" | "post", options?: { barId?: string; postId?: string }) => {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      url.searchParams.delete("bar");
      url.searchParams.delete("post");

      if (nextView === "bar" && options?.barId) {
        url.searchParams.set("bar", options.barId);
      }

      if (nextView === "post" && options?.postId) {
        url.searchParams.set("post", options.postId);
      }

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    },
    []
  );

  const openHomeView = React.useCallback(() => {
    setView("home");
    setActiveBarId("");
    setActivePostId("");
    setActiveBarDetail(null);
    setActivePostDetail(null);
    setDetailError("");
    setPostReturnBarId("");
    syncHistoryState("home");
  }, [syncHistoryState]);

  const openBarView = React.useCallback(
    async (barId: string) => {
      if (!barId) return;

      setDetailLoading(true);
      setDetailError("");
      setSelectedBarId(barId);

      try {
        const resp = await fetch(`/api/forum/bar/${barId}/posts`);
        const result = await resp.json();
        if (result.code !== 0 || !result.data?.bar) {
          throw new Error(result.message || (isZh ? "加载吧详情失败" : "Failed to load bar"));
        }

        setActiveBarId(barId);
        setActivePostId("");
        setActivePostDetail(null);
        setActiveBarDetail({
          bar: result.data.bar as ForumBar,
          posts: Array.isArray(result.data.posts) ? (result.data.posts as ForumPost[]) : [],
        });
        setView("bar");
        syncHistoryState("bar", { barId });
      } catch (error: any) {
        setDetailError(error?.message || (isZh ? "加载吧详情失败" : "Failed to load bar"));
      } finally {
        setDetailLoading(false);
      }
    },
    [isZh, syncHistoryState]
  );

  const openPostView = React.useCallback(
    async (postId: string, options?: { returnBarId?: string }) => {
      if (!postId) return;

      setDetailLoading(true);
      setDetailError("");

      try {
        const resp = await fetch(`/api/forum/post/${postId}`);
        const result = await resp.json();
        if (result.code !== 0 || !result.data?.post) {
          throw new Error(result.message || (isZh ? "加载讨论失败" : "Failed to load post"));
        }

        const nextDetail = result.data as ForumPostDetail;
        const nextReturnBarId =
          options?.returnBarId || nextDetail.post.bar?.id || activeBarId || "";

        setActivePostId(postId);
        setActivePostDetail(nextDetail);
        setPostReturnBarId(nextReturnBarId);
        setView("post");
        syncHistoryState("post", { postId });
      } catch (error: any) {
        setDetailError(error?.message || (isZh ? "加载讨论失败" : "Failed to load post"));
      } finally {
        setDetailLoading(false);
      }
    },
    [activeBarId, isZh, syncHistoryState]
  );

  React.useEffect(() => {
    if (initialPostId) {
      void openPostView(initialPostId, { returnBarId: initialBarId });
      return;
    }
    if (initialBarId) {
      void openBarView(initialBarId);
    }
  }, [initialBarId, initialPostId, openBarView, openPostView]);

  const handlePostChange = React.useCallback((nextPost: ForumPost) => {
    setPosts((current) =>
      current.map((item) => (item.id === nextPost.id ? { ...item, ...nextPost } : item))
    );
    setActiveBarDetail((current) =>
      current
        ? {
            ...current,
            posts: current.posts.map((item) =>
              item.id === nextPost.id ? { ...item, ...nextPost } : item
            ),
          }
        : current
    );
    setActivePostDetail((current) =>
      current && current.post.id === nextPost.id
        ? {
            ...current,
            post: {
              ...current.post,
              ...nextPost,
            },
          }
        : current
    );
  }, []);

  const handlePostCreated = React.useCallback((createdPost: ForumPost) => {
    setPosts((current) => [createdPost, ...current.filter((item) => item.id !== createdPost.id)]);
    setActiveBarDetail((current) =>
      current && current.bar.id === createdPost.bar_id
        ? {
            ...current,
            posts: [createdPost, ...current.posts.filter((item) => item.id !== createdPost.id)],
          }
        : current
    );
  }, []);

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingPost(true);

    try {
      const resp = await fetch("/api/forum/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          bar_id: selectedBarId,
        }),
      });

      const result = await resp.json();
      if (result.code !== 0 || !result.data?.id) {
        throw new Error(result.message || (isZh ? "发帖失败" : "Failed to publish"));
      }

      setPostTitle("");
      setPostContent("");
      setPostDialogOpen(false);
      toast.success(isZh ? "帖子已发布" : "Post published");
      handlePostCreated(result.data as ForumPost);
      void openPostView(result.data.id, {
        returnBarId: selectedBarId,
      });
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "发帖失败" : "Failed to publish"));
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleCreateBar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingBar(true);

    try {
      const resp = await fetch("/api/forum/bar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: barName,
          description: barDescription,
          cover_image: barCover,
        }),
      });

      const result = await resp.json();
      if (result.code !== 0 || !result.data?.id) {
        throw new Error(result.message || (isZh ? "创建吧失败" : "Failed to create bar"));
      }

      setBarName("");
      setBarDescription("");
      setBarCover("");
      toast.success(isZh ? "吧创建成功" : "Bar created");
      const createdBar = result.data as ForumBar;
      setBars((current) => [createdBar, ...current.filter((item) => item.id !== createdBar.id)]);
      setSelectedBarId(createdBar.id);
      void openBarView(createdBar.id);
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "创建吧失败" : "Failed to create bar"));
    } finally {
      setSubmittingBar(false);
    }
  };

  const handleToggleFollow = async (barId: string) => {
    const previousBar = bars.find((item) => item.id === barId);
    if (!previousBar) return;

    const optimisticFollowed = !previousBar.followed;
    const optimisticFollowCount = Math.max(
      0,
      previousBar.follow_count + (optimisticFollowed ? 1 : -1)
    );

    setFollowingBarId(barId);
    setBars((current) =>
      current.map((item) =>
        item.id === barId
          ? {
              ...item,
              followed: optimisticFollowed,
              follow_count: optimisticFollowCount,
            }
          : item
      )
    );

    try {
      const resp = await fetch("/api/forum/bar/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bar_id: barId }),
      });

      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || (isZh ? "关注失败" : "Follow failed"));
      }

      setBars((current) =>
        current.map((item) =>
          item.id === barId
            ? {
                ...item,
                followed: Boolean(result.data?.followed),
                follow_count: Number(result.data?.follow_count || 0),
              }
            : item
        )
      );
    } catch (error: any) {
      setBars((current) =>
        current.map((item) => (item.id === barId ? previousBar : item))
      );
      toast.error(error?.message || (isZh ? "关注失败" : "Follow failed"));
    } finally {
      setFollowingBarId("");
    }
  };

  const heroTitle = isZh ? "杭艺论坛" : "Hangyi Forum";
  const heroDesc = isZh
    ? "围绕作品进度、展讯征集、材料工艺与校园观察，分享正在发生的创作现场。"
    : "A shared space for works in progress, exhibition calls, making notes, and studio conversations.";

  const showingFollowed = followingBarIds.length > 0;

  const sectionClass = cn(
    "rounded-xl border border-border bg-card",
    "shadow-sm text-foreground"
  );

  const createPostDialog = (
    <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
      <DialogContent className="max-w-[680px] rounded-2xl border-border bg-background p-0 shadow-2xl">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{isZh ? "发布新讨论" : "Start a thread"}</DialogTitle>
            <DialogDescription>
              {isZh
                ? "选一个吧，再发作品进度、布展记录、问题求助或展讯分享。"
                : "Choose a bar, then share work in progress, exhibition notes, questions, or open calls."}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-5 space-y-3" onSubmit={handleCreatePost}>
            <select
              value={selectedBarId}
              onChange={(event) => setSelectedBarId(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {bars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <Input
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder={
                isZh ? "标题可选，例如：油画毕业创作想听听修改建议" : "Optional title"
              }
              className="h-11"
            />

            <Textarea
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder={
                isZh
                  ? "可以写作品构思、材料尝试、布展照片、征集信息，或你现在卡住的问题。"
                  : "Share your concept, making notes, install shots, or the question you are stuck on."
              }
              className="min-h-[180px]"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingPost || !selectedBarId}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingPost
                  ? isZh
                    ? "发布中..."
                    : "Publishing..."
                  : isZh
                    ? "发布帖子"
                    : "Publish"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      {createPostDialog}

      <div className="w-full px-1.5 pb-8 pt-2 sm:px-3 sm:pb-10 sm:pt-3 lg:px-4">
        <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[220px_minmax(0,1fr)_280px] 2xl:grid-cols-[230px_minmax(0,1fr)_300px]">
          {/* Left */}
          <aside className="hidden min-w-0 lg:block">
            <div className="space-y-4 lg:sticky lg:top-3 lg:z-10 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:pr-0.5">
              <section className={cn(sectionClass, "p-4")}> 
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                  <Home className="h-4 w-4 shrink-0" />
                  {isZh ? "论坛首页" : "Forum home"}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {isZh
                    ? "按方向聚合课程讨论、作品互评、布展记录和展讯消息。"
                    : "Gather studio critiques, exhibition notes, and topic-based discussions by bar."}
                </p>

                <button
                  type="button"
                  onClick={() => setPostDialogOpen(true)}
                  className="inline-flex min-w-[112px] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  {isZh ? "发布讨论" : "Publish"}
                </button>
              </section>

              

              <section className={cn(sectionClass, "p-4")}> 
                <h3 className="text-sm font-semibold">{isZh ? "推荐讨论吧" : "Suggested bars"}</h3>
                <nav
                  ref={leftBarsNavRef}
                  className="relative mt-3 space-y-0.5"
                  aria-label={isZh ? "吧列表" : "Bar list"}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 rounded-lg border border-primary/20 bg-primary/10 shadow-sm transition-[top,height,opacity] duration-300 ease-out"
                    style={{
                      top: leftBarIndicator.top,
                      height: leftBarIndicator.height,
                      opacity: leftBarIndicator.opacity,
                    }}
                  />
                  {bars.map((bar) => {
                    const cover = bar.cover_image
                      ? proxifyAvatarUrl(bar.cover_image) || bar.cover_image
                      : "";

                    return (
                      <button
                        key={bar.id}
                        ref={(node) => {
                          leftBarItemRefs.current[bar.id] = node;
                        }}
                        type="button"
                        onClick={() => void openBarView(bar.id)}
                        className={cn(
                          "relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-foreground transition",
                          selectedBarId === bar.id
                            ? "text-primary"
                            : "hover:bg-accent/70 hover:text-accent-foreground"
                        )}
                      >
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                              {barInitial(bar.name)}
                            </div>
                          )}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{bar.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </section>
            </div>
          </aside>

          {/* Center */}
          <div className="min-w-0 ">
            {detailLoading ? (
              <div className={cn(sectionClass, "px-6 py-12 text-center text-sm text-muted-foreground")}>
                {isZh ? "正在加载内容..." : "Loading..."}
              </div>
            ) : detailError ? (
              <div className={cn(sectionClass, "space-y-4 px-6 py-12 text-center")}>
                <p className="text-sm text-destructive">{detailError}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (view === "post" && activePostId) {
                      void openPostView(activePostId, { returnBarId: postReturnBarId });
                      return;
                    }
                    if (view === "bar" && activeBarId) {
                      void openBarView(activeBarId);
                      return;
                    }
                    openHomeView();
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  {isZh ? "重试" : "Retry"}
                </button>
              </div>
            ) : view === "post" && activePostDetail ? (
              <ForumPostDetailSection
                locale={locale}
                postId={activePostDetail.post.id}
                initialDetail={activePostDetail}
                onBack={() => {
                  if (postReturnBarId) {
                    void openBarView(postReturnBarId);
                    return;
                  }
                  openHomeView();
                }}
                onOpenBar={(barId) => void openBarView(barId)}
                onPostChange={handlePostChange}
              />
            ) : view === "bar" && activeBarDetail ? (
              <ForumBarDetailSection
                locale={locale}
                initialBar={activeBarDetail.bar}
                initialPosts={activeBarDetail.posts}
                onBack={openHomeView}
                onOpenPost={(post) =>
                  void openPostView(post.id, { returnBarId: activeBarDetail.bar.id })
                }
                onPostChange={handlePostChange}
                onPostCreated={handlePostCreated}
              />
            ) : (
              <>
                {/* Mobile: bar chips */}
                <div className="lg:hidden">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isZh ? "进入吧" : "Bars"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPostDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isZh ? "发布讨论" : "Publish"}
                    </button>
                  </div>
                  <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1 pr-3 [scrollbar-width:thin]">
                    {bars.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void openBarView(item.id)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                          item.followed
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <section className={cn(sectionClass, "p-4 sm:p-5")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{isZh ? "逛吧入口" : "Bar directory"}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isZh
                          ? "中间先看各个吧，像贴吧一样先找到话题场，再进去看帖或发帖。"
                          : "Browse bars first, then enter the topic space you want to read or post in."}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      <Users className="h-3.5 w-3.5" />
                      {showingFollowed
                        ? isZh
                          ? "优先逛你关注的吧"
                          : "Followed bars first"
                        : isZh
                          ? "先看当前活跃吧"
                          : "Active bars first"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {bars.map((bar) => {
                      const cover = bar.cover_image
                        ? proxifyAvatarUrl(bar.cover_image) || bar.cover_image
                        : "";

                      return (
                        <div
                          key={bar.id}
                          id={`bar-card-${bar.id}`}
                          className="scroll-mt-24 flex h-[216px] flex-col rounded-xl border border-border bg-background/80 p-4 transition hover:border-primary/30 hover:bg-accent/40"
                        >
                          <div className="flex min-h-0 shrink-0 items-start gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {cover ? (
                                <img src={cover} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                                  {barInitial(bar.name)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => void openBarView(bar.id)}
                                className="block w-full truncate text-left text-sm font-semibold hover:text-primary"
                              >
                                {bar.name}
                              </button>
                              <div className="mt-1 h-10">
                                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                  {bar.description ||
                                    (isZh ? "还没有简介，适合补充这个吧的讨论方向。" : "No description yet.")}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex shrink-0 flex-col gap-3 pt-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 gap-3 text-xs text-muted-foreground">
                                <span className="shrink-0">{isZh ? `帖子 ${bar.post_count}` : `${bar.post_count} posts`}</span>
                                <span className="shrink-0">{isZh ? `关注 ${bar.follow_count}` : `${bar.follow_count} follows`}</span>
                              </div>
                              <button
                                type="button"
                                disabled={followingBarId === bar.id}
                                onClick={() => void handleToggleFollow(bar.id)}
                                className={cn(
                                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60",
                                  bar.followed
                                    ? "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                              >
                                {followingBarId === bar.id
                                  ? isZh
                                    ? "处理中..."
                                    : "..."
                                  : bar.followed
                                    ? isZh
                                      ? "已关注"
                                      : "Following"
                                    : isZh
                                      ? "关注"
                                      : "Follow"}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => void openBarView(bar.id)}
                              className="inline-flex w-fit items-center text-sm font-medium text-primary hover:underline"
                            >
                              {isZh ? "进入这个吧" : "Enter bar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold">
                      {showingFollowed
                        ? isZh
                          ? "你关注的创作现场"
                          : "Followed discussions"
                        : isZh
                          ? "正在发生的讨论"
                          : "What is active now"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {showingFollowed
                        ? isZh
                          ? "按最后回复时间排序，最近被回应的作品和话题会排在前面。"
                          : "Sorted by latest replies, so recently revived conversations stay on top."
                        : isZh
                          ? "你还没关注方向，先看看当前最活跃的作品讨论和展讯话题。"
                          : "You have not followed any bars yet, so the feed shows the most active conversations."}
                    </p>
                  </div>

                  {posts.length === 0 ? (
                    <div className={cn(sectionClass, "px-6 py-12 text-center")}>
                      <p className="text-base font-medium">
                        {isZh ? "还没有讨论，先发出第一条作品现场。" : "No threads yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {posts.map((post, index) => (
                        <ForumPostCard
                          key={post.id}
                          locale={locale}
                          post={post}
                          featured={index === 0}
                          layout="split"
                          href={null}
                          onOpenPost={(item) =>
                            void openPostView(item.id, { returnBarId: item.bar?.id || "" })
                          }
                          onPostChange={handlePostChange}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Right */}
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-3 lg:z-10 lg:max-h-[calc(100dvh-5rem)] lg:self-start lg:overflow-y-auto lg:pr-0.5">
            <section className={cn(sectionClass, "p-5")}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="text-base font-semibold">{isZh ? "活跃讨论吧" : "Active bars"}</h3>
              </div>

              <div className="mt-4 space-y-3">
                {bars.map((bar) => (
                  <div key={bar.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => void openBarView(bar.id)}
                          className="truncate text-left text-sm font-semibold hover:underline"
                        >
                          {bar.name}
                        </button>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {bar.description ||
                            (isZh ? "这个吧还没有简介，欢迎补充它的创作方向。" : "No description yet.")}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={followingBarId === bar.id}
                        onClick={() => void handleToggleFollow(bar.id)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60",
                          bar.followed
                            ? "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {followingBarId === bar.id
                          ? isZh
                            ? "处理中..."
                            : "..."
                          : bar.followed
                            ? isZh
                              ? "已关注"
                              : "Following"
                            : isZh
                              ? "关注"
                              : "Follow"}
                      </button>
                    </div>

                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                      <span>{isZh ? `帖子 ${bar.post_count}` : `${bar.post_count} posts`}</span>
                      <span>{isZh ? `关注 ${bar.follow_count}` : `${bar.follow_count} follows`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn(sectionClass, "p-5")}>
              <h3 className="text-base font-semibold">{isZh ? "创建新吧" : "Create a bar"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isZh
                  ? "适合围绕学院、工作室、媒介方向、课程主题或策展计划建立长期讨论。"
                  : "Create a long-term space for a studio, medium, course, or curatorial topic."}
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleCreateBar}>
                <Input
                  value={barName}
                  onChange={(event) => setBarName(event.target.value)}
                  placeholder={isZh ? "吧名，例如：版画交换吧" : "Bar name"}
                  className="h-11"
                />
                <Textarea
                  value={barDescription}
                  onChange={(event) => setBarDescription(event.target.value)}
                  placeholder={isZh ? "一句话说明这个吧讨论什么、适合谁加入" : "Describe the focus of this bar"}
                  className="min-h-[92px]"
                />
                <Input
                  value={barCover}
                  onChange={(event) => setBarCover(event.target.value)}
                  placeholder={isZh ? "封面图 URL，可选" : "Cover URL (optional)"}
                  className="h-11"
                />

                <button
                  type="submit"
                  disabled={submittingBar}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingBar
                    ? isZh
                      ? "创建中..."
                      : "Creating..."
                    : isZh
                      ? "创建吧"
                      : "Create"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
