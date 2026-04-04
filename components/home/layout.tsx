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
    <div className="flex min-h-[100svh] w-full min-w-0 flex-col overflow-x-clip bg-background md:h-dvh md:max-h-dvh md:min-h-0 md:overflow-hidden">
      {header ? (
        <div className="shrink-0">
          <HomeHeader header={header} />
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col md:overflow-hidden">
        <div
          data-home-main-shell="true"
          className="flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-2 pt-1.5 sm:gap-2.5 sm:px-2.5 sm:pb-2.5 sm:pt-2 md:gap-4 md:px-3 md:pb-4 md:pt-3 lg:flex-row lg:items-stretch lg:gap-4 lg:pl-4 lg:pr-3"
        >
          <HomeSidebarShell rails={rails} locale={locale} />

          <section
            data-home-content="true"
            className="flex min-h-0 w-full min-w-0 max-w-none flex-1 flex-col overflow-visible md:overflow-y-auto md:overflow-x-hidden"
          >
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
