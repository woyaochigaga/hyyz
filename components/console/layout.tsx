import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import SidebarNav from "@/components/console/sidebar/nav";

export default async function ConsoleLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: Sidebar;
}) {
  return (
    <div className="w-full px-6 py-8">
      <div className="w-full pb-16">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          {sidebar?.nav?.items && (
            <aside className="lg:w-1/5 lg:pr-6 lg:border-r lg:border-border">
              <SidebarNav items={sidebar.nav?.items} />
            </aside>
          )}
          <div className="flex-1 lg:max-w-full">
            <div className="rounded-lg border bg-card p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
