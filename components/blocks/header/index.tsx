"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";

export default function Header({ header }: { header: HeaderType }) {
  const { theme } = useAppContext();
  if (header.disabled) {
    return null;
  }

  return (
    <section className="relative z-[100] w-full shrink-0 border-b border-border/50 bg-background/85 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:py-2">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Desktop: brand + horizontal nav + actions */}
        <nav className="hidden h-14 w-full items-center justify-between gap-4 lg:flex">
          <div className="flex min-w-0 items-center gap-6">
            <a
              href={header.brand?.url || ""}
              className="flex min-w-0 shrink-0 items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={
                    theme === "dark"
                      ? "/logo-black.png"
                      : header.brand.logo.src
                  }
                  alt={header.brand.logo.alt || header.brand.title}
                  className="h-9 w-9 shrink-0"
                />
              )}
              {header.brand?.title && (
                <span className="header-brand-title truncate text-xl font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </a>
            <div className="flex min-w-0 items-center">
              <NavigationMenu className="hero-nav">
                <NavigationMenuList className="hero-nav-list">
                  {header.nav?.items?.map((item, i) => {
                    if (item.children && item.children.length > 0) {
                      return (
                        <NavigationMenuItem
                          key={i}
                          className="hero-nav-item text-muted-foreground"
                        >
                          <NavigationMenuTrigger className="hero-nav-trigger">
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0 mr-2"
                              />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="hero-nav-dropdown w-80 p-3">
                              <NavigationMenuLink>
                                {item.children.map((iitem, ii) => (
                                  <li key={ii}>
                                    <a
                                      className={cn(
                                        "hero-nav-dropdown-item flex select-none gap-4  rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      )}
                                      href={iitem.url}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon
                                          name={iitem.icon}
                                          className="size-5 shrink-0"
                                        />
                                      )}
                                      <div>
                                        <div className="text-l font-semibold">
                                          {iitem.title}
                                        </div>
                                        <p className="text-l leading-snug text-muted-foreground">
                                          {iitem.description}
                                        </p>
                                      </div>
                                    </a>
                                  </li>
                                ))}
                              </NavigationMenuLink>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={i}>
                        <a
                          className={cn(
                            "hero-nav-link text-muted-foreground",
                            navigationMenuTriggerStyle,
                            buttonVariants({
                              variant: "ghost",
                            })
                          )}
                          href={item.url}
                          target={item.target}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-0"
                            />
                          )}
                          {item.title}
                        </a>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}

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
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
            {header.show_sign && <SignToggle />}
          </div>
        </nav>

        {/* Mobile: 单行顶栏，避免与桌面导航重复叠放 */}
        <div className="flex items-center justify-between gap-1.5 py-0 lg:hidden sm:gap-2 sm:py-0.5">
          <a
            href={header.brand?.url || ""}
            className="flex min-w-0 max-w-[60%] items-center gap-1.5 sm:max-w-[65%] sm:gap-2"
          >
            {header.brand?.logo?.src && (
              <img
                src={
                  theme === "dark" ? "/logo-black.png" : header.brand.logo.src
                }
                alt={header.brand.logo.alt || header.brand.title}
                className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
              />
            )}
            {header.brand?.title && (
              <span className="header-brand-title truncate text-sm font-bold tracking-wide sm:text-base md:text-lg">
                {header.brand?.title || ""}
              </span>
            )}
          </a>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-1.5">
            {header.show_locale && (
              <div className="scale-[0.88] origin-right sm:scale-95 md:scale-100">
                <LocaleToggle />
              </div>
            )}
            {header.show_theme && (
              <div className="scale-[0.88] origin-right sm:scale-95 md:scale-100">
                <ThemeToggle />
              </div>
            )}
            {header.show_sign && (
              <div className="scale-[0.88] origin-right sm:scale-95 md:scale-100">
                <SignToggle />
              </div>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9">
                  <Menu className="size-[15px] sm:size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      {header.brand?.logo?.src && (
                        <img
                          src={header.brand.logo.src}
                          alt={header.brand.logo.alt || header.brand.title}
                          className="w-8"
                        />
                      )}
                      {header.brand?.title && (
                        <span className="text-xl font-bold">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-xl text-left">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2">
                              {item.children.map((iitem, ii) => (
                                <a
                                  key={ii}
                                  className={cn(
                                    "flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
                                    <div className="text-base font-semibold sm:text-lg">
                                      {iitem.title}
                                    </div>
                                    <p className="text-sm leading-snug text-muted-foreground">
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
                          className="font-semibold my-4 flex items-center gap-2"
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
                <div className="border-t pt-4">
                  <div className="mt-2 flex flex-col gap-3">
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
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
