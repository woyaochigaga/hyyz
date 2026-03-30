"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  CircleHelp,
  Home,
  Keyboard,
  MessageCircle,
  Moon,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iconBtn =
  "rounded-lg p-2 text-muted-foreground outline-none transition hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function HomeSidebarSettingsDock({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const { resolvedTheme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = React.useState(false);
  const [portalReady, setPortalReady] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeTimer = React.useRef<number | null>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = React.useState({ left: 0, bottom: 0, maxHeight: 320 });

  React.useEffect(() => {
    setThemeReady(true);
    setPortalReady(true);
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const scheduleCloseMenu = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 200);
  };

  const updateMenuPosition = React.useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const topSafe = 8;
    const maxHeight = Math.max(180, rect.top - gap - topSafe);
    setMenuBox({
      left: rect.left,
      bottom: window.innerHeight - rect.top + gap,
      maxHeight,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const onMove = () => updateMenuPosition();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [menuOpen, updateMenuPosition]);

  const toggleScheme = () => {
    if (!themeReady) return;
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const coming = () => toast.message(t("ai_chat.settings_coming"));

  const menuSurface = cn(
    "min-w-[236px] max-w-[min(100vw-1rem,280px)] rounded-xl p-1.5 shadow-xl backdrop-blur-xl",
    "border border-border/35 bg-popover/95 text-popover-foreground",
    "dark:border-white/[0.08] dark:bg-[rgba(46,48,60,0.97)] dark:text-zinc-100 dark:shadow-[0_16px_48px_rgba(0,0,0,0.42)]"
  );

  const rowBase = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition",
    "text-foreground hover:bg-muted/80",
    "dark:text-zinc-100 dark:hover:bg-white/[0.06]"
  );

  const menuContent = (
    <div className={cn(menuSurface, "max-h-full overflow-y-auto overflow-x-hidden")} role="menu" aria-label={t("ai_chat.settings_title")}>
      <button type="button" className={rowBase} onClick={coming}>
        <Home className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_home_default")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-45" />
      </button>
      <button type="button" className={rowBase} onClick={toggleScheme}>
        <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_theme")}</span>
        {themeReady && resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <Sun className="h-4 w-4 shrink-0 opacity-70" />
        )}
      </button>
      <button type="button" className={rowBase} onClick={coming}>
        <Settings className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_general")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-45" />
      </button>
      <button type="button" className={rowBase} onClick={coming}>
        <Sparkles className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_ai")}</span>
      </button>
      <button type="button" className={rowBase} onClick={coming}>
        <Keyboard className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_shortcuts")}</span>
      </button>
      <button type="button" className={rowBase} onClick={coming}>
        <Shield className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_privacy")}</span>
      </button>
      <Link
        href={`/${locale}/posts`}
        className={rowBase}
        onClick={() => setMenuOpen(false)}
      >
        <CircleHelp className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_faq")}</span>
      </Link>
      <button type="button" className={rowBase} onClick={coming}>
        <MessageCircle className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_support")}</span>
      </button>
    </div>
  );

  return (
    <div className="flex items-center justify-between gap-1">
      <div
        ref={anchorRef}
        className="relative flex items-center"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleCloseMenu}
      >
        {portalReady && menuOpen
          ? createPortal(
              <div
                className="fixed z-[200] flex flex-col items-start"
                style={{
                  left: menuBox.left,
                  bottom: menuBox.bottom,
                  maxHeight: menuBox.maxHeight,
                }}
                onMouseEnter={openMenu}
                onMouseLeave={scheduleCloseMenu}
              >
                {menuContent}
              </div>,
              document.body
            )
          : null}
        <button
          type="button"
          className={iconBtn}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={t("ai_chat.settings_title")}
          onClick={() => {
            clearCloseTimer();
            setMenuOpen((open) => !open);
          }}
        >
          <Settings className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={iconBtn}
          aria-label={t("ai_chat.settings_help")}
          onClick={coming}
        >
          <CircleHelp className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label={t("ai_chat.settings_feedback")}
          onClick={coming}
        >
          <MessageCircle className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
