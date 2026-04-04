"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import HomeSidebarNav, {
  isHomeNavItemActive,
  resolveHomeNavHref,
} from "@/components/home/sidebar-nav";
import HomeSidebarSettingsDock from "@/components/home/sidebar-settings-dock";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavItem } from "@/types/blocks/base";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type RailCard = {
  title: string;
  description?: string;
};

type HomeRails = {
  left?: RailCard[];
  leftNav?: NavItem[];
};

const STORAGE_KEY = "home:sidebar-collapsed";

export default function HomeSidebarShell({
  rails,
  locale,
}: {
  rails?: HomeRails;
  locale: string;
}) {
  const t = useTranslations("home");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = rails?.leftNav ?? [];

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setCollapsed(saved === "1");
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <>
      {navItems.length > 0 ? (
        <div className="md:hidden">
          <div className="flex items-center gap-1.5 rounded-2xl border border-border/50 bg-background/85 p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur sm:gap-2 sm:rounded-[22px] sm:p-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg shadow-sm ring-1 ring-primary/25 sm:h-10 sm:w-10 sm:rounded-xl [&_svg]:text-primary-foreground"
                  aria-label={t("sidebar_expand")}
                >
                  <Menu className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(100vw-2.5rem,22rem)] max-w-none border-border/60 p-0 shadow-2xl sm:w-[min(100vw-3rem,24rem)]"
              >
                <div className="flex min-h-full flex-col bg-background px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pt-5">
                  <SheetHeader className="mb-3 text-left sm:mb-5">
                    <SheetTitle className="text-left text-sm font-semibold sm:text-base">
                      {t("sidebar_expand")}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="rounded-xl bg-muted/20 p-1.5 sm:rounded-2xl sm:p-2">
                    <HomeSidebarNav
                      items={navItems}
                      locale={locale}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>

                  {(rails?.left || []).map((item, idx) => (
                    <div
                      key={`mobile-left-${idx}`}
                      className="mt-2 rounded-xl border border-border/30 bg-muted/20 p-2.5 text-[11px] text-muted-foreground sm:mt-3 sm:rounded-2xl sm:p-3 sm:text-xs"
                    >
                      <p className="font-medium text-foreground/85">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-1 text-[11px] leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="mt-3 border-t border-border/50 pt-3 sm:mt-5 sm:pt-4">
                    <HomeSidebarSettingsDock locale={locale} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:pb-1 [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const title = item.title || item.name || "";
                const href = resolveHomeNavHref(item.url, locale);
                const active = isHomeNavItemActive(pathname, item.url, locale);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:py-2 sm:text-sm",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/55 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <aside
        data-home-sidebar="true"
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "hidden min-h-0 w-full max-h-full shrink-0 flex-col overflow-hidden md:flex",
          collapsed ? "md:w-[76px] lg:w-[84px]" : "md:w-[176px] lg:w-[192px]"
        )}
      >
        <div
          className={cn(
            "mb-2 flex shrink-0",
            collapsed ? "justify-center px-0" : "justify-start px-2"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            aria-label={
              collapsed ? t("sidebar_expand") : t("sidebar_collapse")
            }
            title={collapsed ? t("sidebar_expand") : t("sidebar_collapse")}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" strokeWidth={2} />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={2} />
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-3 pb-3">
            {navItems.length > 0 && (
              <div
                className={cn(
                  "rounded-xl bg-muted/20 p-2",
                  collapsed && "mx-auto w-fit"
                )}
              >
                <HomeSidebarNav
                  items={navItems}
                  locale={locale}
                  collapsed={collapsed}
                />
              </div>
            )}
            {!collapsed &&
              (rails?.left || []).map((item, idx) => (
                <div
                  key={`left-${idx}`}
                  className="rounded-xl border border-border/20 bg-muted/20 p-3 text-xs text-muted-foreground"
                >
                  <p className="font-medium text-foreground/85">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-[11px] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className={cn("shrink-0 pb-0 pt-2", collapsed ? "px-0" : "px-1")}>
          <HomeSidebarSettingsDock locale={locale} collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
