"use client";

import Link from "next/link";
import { NavItem } from "@/types/blocks/base";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Sparkles,
  Search,
  UserPlus,
  Users,
  User,
  Video,
  Play,
  MessageSquare,
  MapPinned,
  BotMessageSquare,
  PenSquare,
  LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  search: Search,
  "user-plus": UserPlus,
  users: Users,
  user: User,
  video: Video,
  play: Play,
  "message-square": MessageSquare,
  "map-pinned": MapPinned,
  "bot-message-square": BotMessageSquare,
  "pen-square": PenSquare,
};

const normalizeHomeNavPath = (value: string, locale: string) => {
  const normalized = value.startsWith("/") ? value : `/${value}`;

  if (normalized === `/${locale}`) {
    return "/";
  }

  if (normalized.startsWith(`/${locale}/`)) {
    return normalized.slice(locale.length + 1) || "/";
  }

  return normalized;
};

export const resolveHomeNavHref = (url: string | undefined, locale: string) => {
  if (!url) {
    return "#";
  }

  if (
    url.startsWith("#") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;

  if (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`)) {
    return normalized;
  }

  return `/${locale}${normalized}`;
};

export const isHomeNavItemActive = (
  pathname: string | null,
  url: string | undefined,
  locale: string
) => {
  if (!pathname || !url) {
    return false;
  }

  const currentPath = normalizeHomeNavPath(pathname, locale);
  const targetPath = normalizeHomeNavPath(url, locale);

  return targetPath === "/home"
    ? currentPath === targetPath
    : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

export default function HomeSidebarNav({
  items,
  locale,
  collapsed = false,
  onNavigate,
}: {
  items: NavItem[];
  locale: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={120}>
      <nav className="space-y-1.5 md:space-y-2">
        {items.map((item) => {
          const active = isHomeNavItemActive(pathname, item.url, locale);
          const Icon = item.icon ? iconMap[item.icon] : null;
          const title = item.title || item.name || "";
          const href = resolveHomeNavHref(item.url, locale);

          const link = (
            <Link
              key={title}
              href={href}
              onClick={onNavigate}
              aria-label={collapsed ? title : undefined}
              className={cn(
                "group relative flex items-center gap-2 overflow-hidden rounded-lg text-[0.8125rem] font-medium outline-none transition-all duration-200 ease-out md:gap-3 md:rounded-xl md:text-sm",
                "hover:-translate-y-px active:translate-y-0",
                collapsed
                  ? "h-11 w-11 justify-center px-0 py-0"
                  : "justify-start px-2.5 py-2 md:px-3 md:py-2.5",
                active
                  ? [
                      "bg-primary/[0.13] text-primary shadow-sm",
                      "ring-1 ring-primary/25 dark:ring-primary/35",
                      !collapsed &&
                        "before:absolute before:left-0 before:top-1/2 before:h-[60%] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-90",
                    ]
                  : [
                      "text-muted-foreground",
                      "hover:bg-muted/70 hover:text-foreground hover:shadow-sm",
                      "hover:ring-1 hover:ring-border/60 dark:hover:ring-border/40",
                    ],
                "focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "relative z-[1] h-4 w-4 shrink-0 transition-transform duration-200 ease-out md:h-5 md:w-5",
                    active
                      ? "text-primary [filter:drop-shadow(0_0_6px_hsl(var(--primary)_/_0.35))]"
                      : "text-muted-foreground/90 group-hover:scale-110 group-hover:text-foreground"
                  )}
                  strokeWidth={active ? 2.25 : 2}
                />
              )}
              {collapsed ? (
                <span className="sr-only">{title}</span>
              ) : (
                <span className="relative z-[1] tracking-tight">{title}</span>
              )}
            </Link>
          );

          if (!collapsed) {
            return link;
          }

          return (
            <Tooltip key={title}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
