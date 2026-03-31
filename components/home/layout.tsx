import { ReactNode } from "react";
import HomeHeader from "@/components/blocks/home-header";
import { Header as HeaderType } from "@/types/blocks/header";
import { NavItem } from "@/types/blocks/base";
import HomeSidebarNav from "@/components/home/sidebar-nav";
import HomeSidebarSettingsDock from "@/components/home/sidebar-settings-dock";

type RailCard = {
  title: string;
  description?: string;
};

type HomeRails = {
  left?: RailCard[];
  leftNav?: NavItem[];
};

export default function HomeLayout({
  children,
  header,
  rails,
  locale,
}: {
  children: ReactNode;
  header?: HeaderType;
  rails?: HomeRails;
  locale: string;
}) {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
      {header ? (
        <div className="shrink-0">
          <HomeHeader header={header} />
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          data-home-main-shell="true"
          className="flex min-h-0 flex-1 flex-col gap-4 px-3 pb-4 pt-3 lg:flex-row lg:items-stretch lg:gap-4 lg:pl-4 lg:pr-3"
        >
          <aside
            data-home-sidebar="true"
            className="hidden min-h-0 w-full max-h-full shrink-0 flex-col overflow-hidden lg:flex lg:w-[220px]"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-3 pb-3">
                {rails?.leftNav && rails.leftNav.length > 0 && (
                  <div className="rounded-xl bg-muted/20 p-2">
                    <HomeSidebarNav items={rails.leftNav} />
                  </div>
                )}
                {(rails?.left || []).map((item, idx) => (
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
            <div className="shrink-0 px-1 pb-0 pt-2">
              <HomeSidebarSettingsDock locale={locale} />
            </div>
          </aside>

          <section
            data-home-content="true"
            className="min-h-0 w-full min-w-0 max-w-none flex-1 overflow-y-auto overflow-x-hidden"
          >
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
