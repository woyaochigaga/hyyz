import { ReactNode } from "react";
import HomeHeader from "@/components/blocks/home-header";
import { Header as HeaderType } from "@/types/blocks/header";
import { NavItem } from "@/types/blocks/base";
import HomeSidebarShell from "@/components/home/sidebar-shell";

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
          <HomeSidebarShell rails={rails} locale={locale} />

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
