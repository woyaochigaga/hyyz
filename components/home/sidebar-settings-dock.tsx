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
  RotateCcw,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_HOME_PREFERENCES,
  type HomePreferences,
  loadHomePreferences,
  saveHomePreferences,
} from "@/lib/home-preferences";
import { cn } from "@/lib/utils";

const iconBtn =
  "rounded-md p-1.5 text-muted-foreground outline-none transition hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:rounded-lg sm:p-2";

const defaultRoutes = [
  { value: "/home", key: "settings_home_default_home" },
  { value: "/home/community", key: "settings_home_default_community" },
  { value: "/home/forum", key: "settings_home_default_forum" },
  { value: "/home/exhibition", key: "settings_home_default_exhibition" },
  { value: "/home/ai-chat", key: "settings_home_default_ai" },
  { value: "/home/post", key: "settings_home_default_post" },
] as const;

function SettingSwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-left transition hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      <span
        className={cn(
          "inline-flex h-6 w-11 items-center rounded-full p-1 transition",
          checked ? "bg-primary justify-end" : "bg-muted justify-start"
        )}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}

export default function HomeSidebarSettingsDock({
  locale,
  collapsed = false,
}: {
  locale: string;
  collapsed?: boolean;
}) {
  const t = useTranslations("home");
  const { resolvedTheme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = React.useState(false);
  const [portalReady, setPortalReady] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState("");
  const [feedbackContact, setFeedbackContact] = React.useState("");
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);
  const [preferences, setPreferences] = React.useState<HomePreferences>(
    DEFAULT_HOME_PREFERENCES
  );
  const closeTimer = React.useRef<number | null>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = React.useState({ left: 0, bottom: 0, maxHeight: 320 });

  React.useEffect(() => {
    setThemeReady(true);
    setPortalReady(true);
    setPreferences(loadHomePreferences());
  }, []);

  React.useEffect(() => {
    if (!themeReady) return;
    if (preferences.theme === "system") return;
    setTheme(preferences.theme);
  }, [preferences.theme, setTheme, themeReady]);

  const persistPreferences = React.useCallback((next: HomePreferences) => {
    setPreferences(next);
    saveHomePreferences(next);
    window.dispatchEvent(
      new CustomEvent("home-preferences-change", {
        detail: next,
      })
    );
  }, []);

  const updatePreference = React.useCallback(
    <K extends keyof HomePreferences>(key: K, value: HomePreferences[K]) => {
      persistPreferences({
        ...preferences,
        [key]: value,
      });
    },
    [persistPreferences, preferences]
  );

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

  const resetPreferences = React.useCallback(() => {
    persistPreferences(DEFAULT_HOME_PREFERENCES);
    setTheme("system");
    toast.success(t("ai_chat.settings_saved"));
  }, [persistPreferences, setTheme, t]);

  const clearChatHistory = React.useCallback(async () => {
    try {
      const keysToDelete: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith("home-ai-chat:")) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => window.localStorage.removeItem(key));
      if (preferences.syncHistoryToCloud) {
        await fetch("/api/home/ai-chat/conversations", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delete_all: true,
          }),
        }).catch(() => null);
      }
      window.dispatchEvent(new CustomEvent("home-ai-chat-clear"));
      toast.success(t("ai_chat.settings_history_cleared"));
    } catch {
      toast.error(t("ai_chat.settings_history_clear_failed"));
    }
  }, [preferences.syncHistoryToCloud, t]);

  const copyFeedback = React.useCallback(async () => {
    const text = feedbackText.trim();
    if (!text) {
      toast.message(t("ai_chat.settings_feedback_empty"));
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(t("ai_chat.settings_feedback_copied"));
  }, [feedbackText, t]);

  const submitFeedback = React.useCallback(async () => {
    const text = feedbackText.trim();
    if (!text) {
      toast.message(t("ai_chat.settings_feedback_empty"));
      return;
    }

    try {
      setSubmittingFeedback(true);
      const resp = await fetch("/api/home/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "home_ai_chat",
          locale,
          contact: feedbackContact.trim(),
          content: text,
          context: {
            theme: preferences.theme,
            defaultRoute: preferences.defaultRoute,
            syncHistoryToCloud: preferences.syncHistoryToCloud,
            aiDefaultDeepThinking: preferences.aiDefaultDeepThinking,
            aiAutoExpandReasoning: preferences.aiAutoExpandReasoning,
            aiShowFollowups: preferences.aiShowFollowups,
            enterBehavior: preferences.enterBehavior,
          },
        }),
      });
      const result = await resp.json();
      if (result?.code !== 0) {
        toast.error(result?.message || t("ai_chat.settings_feedback_submit_failed"));
        return;
      }
      toast.success(t("ai_chat.settings_feedback_submitted"));
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackContact("");
    } catch {
      toast.error(t("ai_chat.settings_feedback_submit_failed"));
    } finally {
      setSubmittingFeedback(false);
    }
  }, [
    feedbackContact,
    feedbackText,
    locale,
    preferences.aiAutoExpandReasoning,
    preferences.aiDefaultDeepThinking,
    preferences.aiShowFollowups,
    preferences.defaultRoute,
    preferences.enterBehavior,
    preferences.syncHistoryToCloud,
    preferences.theme,
    t,
  ]);

  const menuSurface = cn(
    "min-w-[236px] max-w-[min(100vw-1rem,280px)] rounded-xl p-1.5 shadow-xl backdrop-blur-xl",
    "border border-border/35 bg-popover/95 text-popover-foreground",
    "dark:border-white/[0.08] dark:bg-[rgba(46,48,60,0.97)] dark:text-zinc-100 dark:shadow-[0_16px_48px_rgba(0,0,0,0.42)]"
  );

  const rowBase = cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs outline-none transition sm:gap-3 sm:px-3 sm:py-2.5 sm:text-sm",
    "text-foreground hover:bg-muted/80",
    "dark:text-zinc-100 dark:hover:bg-white/[0.06]"
  );

  const menuContent = (
    <div
      className={cn(menuSurface, "max-h-full overflow-y-auto overflow-x-hidden")}
      role="menu"
      aria-label={t("ai_chat.settings_title")}
    >
      <button
        type="button"
        className={rowBase}
        onClick={() => {
          setSettingsOpen(true);
          setMenuOpen(false);
        }}
      >
        <Settings className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_title")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-45" />
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => {
          updatePreference(
            "theme",
            resolvedTheme === "dark" ? "light" : "dark"
          );
          toast.success(t("ai_chat.settings_saved"));
        }}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_theme")}</span>
        {themeReady && resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <Sun className="h-4 w-4 shrink-0 opacity-70" />
        )}
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => {
          setHelpOpen(true);
          setMenuOpen(false);
        }}
      >
        <CircleHelp className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_help_center")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-45" />
      </button>
      <button
        type="button"
        className={rowBase}
        onClick={() => {
          setFeedbackOpen(true);
          setMenuOpen(false);
        }}
      >
        <MessageCircle className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_feedback_center")}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-45" />
      </button>
      <Link
        href={preferences.defaultRoute === "/home" ? `/${locale}/home` : `/${locale}${preferences.defaultRoute}`}
        className={rowBase}
        onClick={() => setMenuOpen(false)}
      >
        <Home className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1">{t("ai_chat.settings_go_default")}</span>
      </Link>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "flex gap-0.5 sm:gap-1",
          collapsed ? "flex-col items-center justify-start" : "items-center justify-between"
        )}
      >
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
            <Settings className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} />
          </button>
        </div>

        <div
          className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-0.5")}
        >
          <button
            type="button"
            className={iconBtn}
            aria-label={t("ai_chat.settings_help")}
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} />
          </button>
          <button
            type="button"
            className={iconBtn}
            aria-label={t("ai_chat.settings_feedback")}
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageCircle className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("ai_chat.settings_title")}</DialogTitle>
            <DialogDescription>{t("ai_chat.settings_description")}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">{t("ai_chat.settings_general")}</TabsTrigger>
              <TabsTrigger value="ai">{t("ai_chat.settings_ai")}</TabsTrigger>
              <TabsTrigger value="shortcut">{t("ai_chat.settings_shortcuts")}</TabsTrigger>
              <TabsTrigger value="privacy">{t("ai_chat.settings_privacy")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium">{t("ai_chat.settings_home_default")}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {defaultRoutes.map((route) => (
                    <button
                      key={route.value}
                      type="button"
                      onClick={() => updatePreference("defaultRoute", route.value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition",
                        preferences.defaultRoute === route.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border/60 bg-background/70 hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="text-sm font-medium">{t(`ai_chat.${route.key}`)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{route.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">{t("ai_chat.settings_theme")}</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "system", label: t("ai_chat.settings_theme_system") },
                    { value: "light", label: t("ai_chat.settings_theme_light") },
                    { value: "dark", label: t("ai_chat.settings_theme_dark") },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updatePreference(
                          "theme",
                          option.value as HomePreferences["theme"]
                        )
                      }
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-medium transition",
                        preferences.theme === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background/70 hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-3">
              <SettingSwitch
                title={t("ai_chat.settings_ai_default_deep")}
                description={t("ai_chat.settings_ai_default_deep_desc")}
                checked={preferences.aiDefaultDeepThinking}
                onCheckedChange={(checked) => updatePreference("aiDefaultDeepThinking", checked)}
              />
              <SettingSwitch
                title={t("ai_chat.settings_ai_expand_reasoning")}
                description={t("ai_chat.settings_ai_expand_reasoning_desc")}
                checked={preferences.aiAutoExpandReasoning}
                onCheckedChange={(checked) => updatePreference("aiAutoExpandReasoning", checked)}
              />
              <SettingSwitch
                title={t("ai_chat.settings_ai_followups")}
                description={t("ai_chat.settings_ai_followups_desc")}
                checked={preferences.aiShowFollowups}
                onCheckedChange={(checked) => updatePreference("aiShowFollowups", checked)}
              />
              <div className="grid gap-2">
                <div className="text-sm font-medium">{t("ai_chat.settings_send_key")}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "send", label: t("ai_chat.settings_send_key_send") },
                    { value: "newline", label: t("ai_chat.settings_send_key_newline") },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updatePreference(
                          "enterBehavior",
                          option.value as HomePreferences["enterBehavior"]
                        )
                      }
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-medium transition",
                        preferences.enterBehavior === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background/70 hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcut" className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Keyboard className="h-4 w-4" />
                  <span>{t("ai_chat.settings_shortcuts")}</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>{t("ai_chat.settings_shortcut_1")}</div>
                  <div>{t("ai_chat.settings_shortcut_2")}</div>
                  <div>{t("ai_chat.settings_shortcut_3")}</div>
                  <div>{t("ai_chat.settings_shortcut_4")}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-3">
              <SettingSwitch
                title={t("ai_chat.settings_history_sync")}
                description={t("ai_chat.settings_history_sync_desc")}
                checked={preferences.syncHistoryToCloud}
                onCheckedChange={(checked) => updatePreference("syncHistoryToCloud", checked)}
              />
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  <span>{t("ai_chat.settings_privacy_notice_title")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("ai_chat.settings_privacy_notice")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={clearChatHistory}>
                    <Trash2 className="h-4 w-4" />
                    {t("ai_chat.settings_clear_history")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetPreferences}>
                    <RotateCcw className="h-4 w-4" />
                    {t("ai_chat.settings_reset")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                toast.success(t("ai_chat.settings_saved"));
                setSettingsOpen(false);
              }}
            >
              {t("ai_chat.settings_done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ai_chat.settings_help_center")}</DialogTitle>
            <DialogDescription>{t("ai_chat.settings_help_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm font-medium">{t("ai_chat.settings_help_ai_title")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("ai_chat.settings_help_ai_desc")}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm font-medium">{t("ai_chat.settings_help_history_title")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("ai_chat.settings_help_history_desc")}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm font-medium">{t("ai_chat.settings_help_privacy_title")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("ai_chat.settings_help_privacy_desc")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/${locale}/home/post`}>{t("ai_chat.settings_faq")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/home/ai-chat`}>{t("ai_chat.settings_help_back_ai")}</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ai_chat.settings_feedback_center")}</DialogTitle>
            <DialogDescription>{t("ai_chat.settings_feedback_desc")}</DialogDescription>
          </DialogHeader>
          <input
            className="h-11 w-full rounded-xl border border-border/60 bg-background/70 px-4 text-sm outline-none focus:border-primary/40"
            placeholder={t("ai_chat.settings_feedback_contact_placeholder")}
            value={feedbackContact}
            onChange={(event) => setFeedbackContact(event.target.value)}
          />
          <textarea
            className="min-h-[180px] w-full rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm outline-none focus:border-primary/40"
            placeholder={t("ai_chat.settings_feedback_placeholder")}
            value={feedbackText}
            onChange={(event) => setFeedbackText(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void copyFeedback()}>
              {t("ai_chat.settings_feedback_copy")}
            </Button>
            <Button type="button" onClick={() => void submitFeedback()} disabled={submittingFeedback}>
              {t("ai_chat.settings_feedback_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
