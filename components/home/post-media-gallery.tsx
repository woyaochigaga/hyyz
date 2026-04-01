"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import { HomePost } from "@/types/home-post";
import { PlayCircle } from "lucide-react";

export function PostMediaGallery({
  post,
  className,
  aspectClassName,
  showBadge = true,
  preferVideoPlayback = false,
}: {
  post: HomePost;
  className?: string;
  aspectClassName?: string;
  showBadge?: boolean;
  preferVideoPlayback?: boolean;
}) {
  const t = useTranslations("home");
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const images = React.useMemo(() => {
    const list = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
    if (list.length > 0) return list;
    return post.cover_url ? [post.cover_url] : [];
  }, [post.cover_url, post.images]);

  React.useEffect(() => {
    if (!carouselApi || images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 2800);

    return () => {
      window.clearInterval(timer);
    };
  }, [carouselApi, images.length]);

  if (post.type === "video" && post.video_url) {
    if (preferVideoPlayback) {
      return (
        <div className={cn("relative overflow-hidden", className)}>
          <video
            src={post.video_url}
            controls
            playsInline
            preload="metadata"
            poster={post.cover_url || undefined}
            className={cn("w-full bg-black object-cover", aspectClassName || "aspect-video")}
          />
          {showBadge ? (
            <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
              {t("feed.type_video")}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className={cn("relative overflow-hidden", className)}>
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title || ""}
            className={cn("w-full object-cover", aspectClassName || "aspect-video")}
          />
        ) : (
          <video
            src={post.video_url}
            controls
            className={cn("w-full bg-black object-cover", aspectClassName || "aspect-video")}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {showBadge ? (
          <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
            {t("feed.type_video")}
          </div>
        ) : null}
        <div className="absolute bottom-4 right-4 rounded-full bg-white/92 p-3 text-zinc-900 shadow-lg">
          <PlayCircle className="h-5 w-5" />
        </div>
      </div>
    );
  }

  if (images.length > 1) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Carousel opts={{ loop: true }} setApi={setCarouselApi} className="w-full">
          <CarouselContent className="ml-0">
            {images.map((image, index) => (
              <CarouselItem key={`${post.uuid}-${index}`} className="pl-0">
                <img
                  src={image}
                  alt={post.title || ""}
                  className={cn("w-full object-cover", aspectClassName || "aspect-[4/3]")}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 top-1/2 border-0 bg-white/90 text-zinc-900 hover:bg-white disabled:opacity-40" />
          <CarouselNext className="right-4 top-1/2 border-0 bg-white/90 text-zinc-900 hover:bg-white disabled:opacity-40" />
        </Carousel>
        {showBadge && post.type === "image" ? (
          <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
            {t("feed.type_image")}
          </div>
        ) : null}
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img
          src={images[0]}
          alt={post.title || ""}
          className={cn("w-full object-cover", aspectClassName || "aspect-[4/3]")}
        />
        {showBadge && post.type === "image" ? (
          <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
            {t("feed.type_image")}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[150px] items-end bg-[radial-gradient(circle_at_top_left,rgba(134,168,157,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(209,220,216,0.34),transparent_34%),linear-gradient(135deg,#f7faf9,#edf2f1)] px-5 py-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(98,129,120,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(63,79,75,0.18),transparent_34%),linear-gradient(135deg,#181c1d,#252b2c)]",
        className
      )}
    >
      <div className="max-w-[85%]">
        {showBadge ? (
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-zinc-700 dark:border dark:border-white/10 dark:bg-[#31413c] dark:text-[#eef7f3]">
            {post.type === "image"
              ? t("feed.type_image")
              : post.type === "video"
                ? t("feed.type_video")
                : t("feed.type_text")}
          </span>
        ) : null}
        <h3 className="mt-3 line-clamp-4 text-xl font-semibold leading-8 text-zinc-900 dark:text-white">
          {post.title || post.excerpt || getHomePostExcerpt(post.content, 80)}
        </h3>
      </div>
    </div>
  );
}
