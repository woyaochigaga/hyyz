"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import HomeSidebarNav from "@/components/home/sidebar-nav";
import HomeSidebarSettingsDock from "@/components/home/sidebar-settings-dock";
import { Button } from "@/components/ui/button";
import { NavItem } from "@/types/blocks/base";
import { cn } from "@/lib/utils";

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
  const [collapsed, setCollapsed] = React.useState(false);

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
          {rails?.leftNav && rails.leftNav.length > 0 && (
            <div
              className={cn(
                "rounded-xl bg-muted/20 p-2",
                collapsed && "mx-auto w-fit"
              )}
            >
              <HomeSidebarNav items={rails.leftNav} collapsed={collapsed} />
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
  );
}
