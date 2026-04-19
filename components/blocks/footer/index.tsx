"use client";

import { Footer as FooterType } from "@/types/blocks/footer";
import type { Brand } from "@/types/blocks/base";
import Icon from "@/components/icon";
import Link from "next/link";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function isExternalHref(href?: string) {
  if (!href) return false;
  return /^(https?:|mailto:|tel:|\/\/)/i.test(href);
}

function FooterLink({
  href,
  target,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href?: string;
  target?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const url = href ?? "#";
  const external = isExternalHref(href) || target === "_blank";

  if (external) {
    return (
      <a
        href={url}
        target={target === "_blank" ? "_blank" : target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={url} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkClass = cn(
  "text-muted-foreground transition-colors hover:text-primary rounded-sm",
  focusRing
);

const socialLinkClass = cn(
  "inline-flex size-10 items-center justify-center rounded-full border border-border/80 bg-background/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary",
  focusRing
);

function FooterBrandBlock({
  brand,
  theme,
}: {
  brand: Brand;
  theme: string;
}) {
  const logoSrc =
    theme === "dark" ? "/logo-black.png" : brand.logo?.src;

  const brandMark = (
    <>
      {brand.logo?.src && logoSrc && (
        <img
          src={logoSrc}
          alt={brand.logo.alt || brand.title || ""}
          className={cn(
            "h-11 w-auto shrink-0",
            brand.url && "transition-opacity group-hover:opacity-90"
          )}
          loading="lazy"
        />
      )}
      {brand.title && (
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {brand.title}
        </span>
      )}
    </>
  );

  if (brand.url) {
    return (
      <FooterLink
        href={brand.url}
        target={brand.target}
        className="group flex items-center justify-center gap-2 lg:justify-start"
      >
        {brandMark}
      </FooterLink>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 lg:justify-start">
      {brandMark}
    </div>
  );
}

export default function Footer({ footer }: { footer: FooterType }) {
  const { theme } = useAppContext();

  if (footer.disabled) {
    return null;
  }

  const navItems = footer.nav?.items?.filter(Boolean) ?? [];
  const showPoweredBy = process.env.NEXT_PUBLIC_SHOW_POWERED_BY !== "false";

  return (
    <footer
      id={footer.name}
      className="w-full border-t border-border/50 bg-muted/20"
    >
      <div className="w-full px-2 py-12 sm:px-3 md:px-4 lg:px-6 lg:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex w-full min-w-0 shrink-0 flex-col items-center gap-8 lg:max-w-md lg:items-start">
            {footer.brand && (
              <div className="flex w-full flex-col items-center gap-6 text-center lg:items-start lg:text-left">
                <FooterBrandBlock brand={footer.brand} theme={theme} />
                {footer.brand.description && (
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {footer.brand.description}
                  </p>
                )}
              </div>
            )}

            {footer.social?.items && footer.social.items.length > 0 && (
              <ul
                className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"
                aria-label="Social links"
              >
                {footer.social.items.map((item, i) => (
                  <li key={`${item.title}-${i}`}>
                    <FooterLink
                      href={item.url}
                      target={item.target}
                      className={socialLinkClass}
                      aria-label={item.title}
                    >
                      {item.icon ? (
                        <Icon name={item.icon} className="size-4" />
                      ) : (
                        <span className="max-w-[6rem] truncate px-1 text-xs font-medium">
                          {item.title}
                        </span>
                      )}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {navItems.length > 0 && (
            <div
              className={cn(
                "grid w-full min-w-0 flex-1 gap-10 sm:grid-cols-2 lg:ml-auto lg:w-auto lg:flex-none lg:grid-cols-3 lg:gap-12",
                "text-center sm:text-left lg:text-right"
              )}
            >
              {navItems.map((item, i) => (
                <div key={`${item.title}-${i}`}>
                  {item.title && (
                    <p className="mb-4 text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                  )}
                  <ul className="space-y-3 text-sm">
                    {item.children?.map((child, ii) => (
                      <li key={`${child.title}-${ii}`}>
                        <FooterLink
                          href={child.url}
                          target={child.target}
                          className={cn(linkClass, "inline-block font-medium")}
                        >
                          {child.title}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:text-left">
          {footer.copyright && (
            <p className="min-w-0 flex-1 leading-relaxed">
              <span>{footer.copyright}</span>
              {showPoweredBy && (
                <>
                  {" "}
                  <FooterLink
                    href="/"
                    className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                  >
                    Hangyi Cloud Expo
                  </FooterLink>
                </>
              )}
            </p>
          )}

          {footer.agreement?.items && footer.agreement.items.length > 0 && (
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
              {footer.agreement.items.map((item, i) => (
                <li key={`${item.title}-${i}`}>
                  <FooterLink
                    href={item.url}
                    target={item.target}
                    className={cn(linkClass, "whitespace-nowrap text-sm")}
                  >
                    {item.title}
                  </FooterLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
