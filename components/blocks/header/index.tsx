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
    <section className="py-2 px-1 w-full">
      <div className="w-full px-3 lg:px-6">
        <nav className="flex justify-between w-full">
          <div className="flex items-center gap-6">
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
                  className="w-9 h-9"
                />
              )}
              {header.brand?.title && (
                <span className="header-brand-title text-xl font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </a>
            <div className="flex items-center">
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
          <div className="shrink-0 flex gap-2 items-center">
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


        {/* Mobile menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon">
                  <Menu className="size-2" />
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
                                  <div>
                                    <div className="text-[2.12rem] font-semibold ">
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
      </div>
    </section>
  );
}
