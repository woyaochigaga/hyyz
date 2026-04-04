"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import Link from "next/link";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import { Search } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import { NotificationCenter } from "@/components/home/notification-center";
import ThemeToggle from "@/components/theme/toggle";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

export default function HomeHeader({ header }: { header: HeaderType }) {
  const { theme, showSignModal } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")?.[1] || "";

  const [query, setQuery] = React.useState("");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (showSignModal) {
      setMobileNavOpen(false);
    }
  }, [showSignModal]);

  if (header.disabled) {
    return null;
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const postsUrl = locale ? `/${locale}/posts` : "/posts";
    router.push(`${postsUrl}?keyword=${encodeURIComponent(q)}`);
  };

  const searchChrome =
    "flex w-full items-stretch overflow-hidden rounded-full border border-zinc-300/90 bg-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-white/[0.08] dark:bg-[#252632] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-zinc-400/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.08)] dark:hover:border-white/[0.15] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)] focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-400/30 dark:focus-within:border-white/20 dark:focus-within:ring-white/10";

  const searchShellMobile = cn(searchChrome, "h-8");
  const searchShellDesktop = cn(searchChrome, "h-9");

  const searchInputClass =
    "min-w-0 flex-1 bg-transparent py-0 pl-3 pr-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500 lg:pl-4 lg:pr-2 lg:text-sm";

  const searchSubmitClass =
    "inline-flex shrink-0 items-center gap-0.5 border-l border-zinc-300/90 bg-zinc-200/80 px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300/80 hover:text-zinc-900 dark:border-white/[0.12] dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white lg:gap-1 lg:px-3.5 lg:text-sm";

  return (
    <section className="relative z-[115] isolate w-full shrink-0 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto w-full px-2 py-1.5 sm:px-3 sm:py-2 lg:px-6 lg:py-0">
        <nav className="hidden h-14 w-full items-center gap-3 lg:flex lg:gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-6">
            <a
              href={header.brand?.url || ""}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={
                    theme === "dark"
                      ? "/logo-black.png"
                      : header.brand.logo.src
                  }
                  alt={header.brand.logo.alt || header.brand.title}
                  className="h-9 w-9"
                />
              )}
              {header.brand?.title && (
                <span className="header-brand-title text-xl font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </a>
          </div>

          {/* Desktop search — centered capsule like Douyin */}
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <form
              onSubmit={submitSearch}
              className={cn(
                searchShellDesktop,
                "max-w-[min(42vw,36rem)] min-w-[16rem]"
              )}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索你感兴趣的内容"
                className={searchInputClass}
                aria-label="搜索"
              />
              <button
                type="submit"
                className={searchSubmitClass}
                aria-label="搜索"
              >
                <Search className="size-[15px] opacity-90" strokeWidth={2.25} />
                搜索
              </button>
            </form>
          </div>

          <div className="ml-auto flex shrink-0 gap-1.5 items-center">
            {/* {header.show_locale && <LocaleToggle />} */}
            <div className="scale-90 origin-right">
              {header.show_theme && <ThemeToggle />}
            </div>
            <div className="scale-90 origin-right">
              <NotificationCenter />
            </div>

            {header.buttons?.map((item, i) => {
              return (
                <Button
                  key={i}
                  variant={item.variant}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Link
                    href={item.url || ""}
                    target={item.target || ""}
                    className="flex items-center gap-1"
                  >
                    {item.title}
                    {item.icon && (
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
            <div className="scale-90 origin-right">
              {header.show_sign && <SignToggle />}
            </div>
          </div>
        </nav>

        <div className="space-y-1.5 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {header.brand?.logo?.src && (
                <img
                  src={
                    theme === "dark"
                      ? "/logo-black.png"
                      : header.brand.logo.src
                  }
                  alt={header.brand.logo.alt || header.brand.title}
                  className="h-7 w-7 shrink-0"
                />
              )}
              {header.brand?.title && (
                <span className="truncate text-base font-bold sm:text-lg">
                  {header.brand?.title || ""}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="scale-[0.88] origin-right sm:scale-90">
                <NotificationCenter />
              </div>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg border-2 border-primary/50 bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:bg-primary/90 hover:text-primary-foreground dark:border-primary/40 dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]"
                  >
                    <Menu className="size-[17px]" strokeWidth={2.5} />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[min(100vw-1rem,22rem)] overflow-y-auto sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>
                      <div className="flex items-center gap-2">
                        {header.brand?.logo?.src && (
                          <img
                            src={
                              theme === "dark"
                                ? "/logo-black.png"
                                : header.brand.logo.src
                            }
                            alt={header.brand.logo.alt || header.brand.title}
                            className="h-8 w-8 shrink-0"
                          />
                        )}
                        {header.brand?.title && (
                          <span className="text-base font-bold sm:text-lg">
                            {header.brand?.title || ""}
                          </span>
                        )}
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mb-6 mt-5 flex flex-col gap-2 sm:mb-8 sm:mt-6 sm:gap-4">
                    <Accordion type="single" collapsible className="w-full">
                      {header.nav?.items?.map((item, i) => {
                        if (item.children && item.children.length > 0) {
                          return (
                            <AccordionItem
                              key={i}
                              value={item.title || ""}
                              className="border-b-0"
                            >
                              <AccordionTrigger className="py-2 text-left text-base font-semibold hover:no-underline sm:mb-2 sm:text-lg">
                                {item.title}
                              </AccordionTrigger>
                              <AccordionContent className="mt-1">
                                {item.children.map((iitem, ii) => (
                                  <a
                                    key={ii}
                                    className={cn(
                                      "flex select-none gap-3 rounded-md p-2.5 leading-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground sm:gap-4 sm:p-3"
                                    )}
                                    href={iitem.url}
                                    target={iitem.target}
                                  >
                                    {iitem.icon && (
                                      <Icon
                                        name={iitem.icon}
                                        className="size-4 shrink-0"
                                      />
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold sm:text-base">
                                        {iitem.title}
                                      </div>
                                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                                        {iitem.description}
                                      </p>
                                    </div>
                                  </a>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        }
                        return (
                          <a
                            key={i}
                            href={item.url}
                            target={item.target}
                            className="my-2 flex items-center gap-2 text-base font-semibold sm:my-3"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0"
                              />
                            )}
                          </a>
                        );
                      })}
                    </Accordion>
                  </div>
                  <div className="flex-1"></div>
                  <div className="pt-3 sm:pt-4">
                    <div className="mt-2 flex flex-col gap-2 sm:gap-3">
                      {header.buttons?.map((item, i) => {
                        return (
                          <Button key={i} variant={item.variant}>
                            <Link
                              href={item.url || ""}
                              target={item.target || ""}
                              className="flex items-center gap-1"
                            >
                              {item.title}
                              {item.icon && (
                                <Icon
                                  name={item.icon}
                                  className="size-4 shrink-0"
                                />
                              )}
                            </Link>
                          </Button>
                        );
                      })}

                      {header.show_sign && <SignToggle />}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {header.show_locale && <LocaleToggle />}
                      <div className="flex-1"></div>

                      {header.show_theme && <ThemeToggle />}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <form onSubmit={submitSearch} className={searchShellMobile}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索你感兴趣的内容"
              className={searchInputClass}
              aria-label="搜索"
            />
            <button
              type="submit"
              className={searchSubmitClass}
              aria-label="搜索"
            >
              <Search className="size-[13px] opacity-90" strokeWidth={2.25} />
              搜索
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
