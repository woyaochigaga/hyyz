"use client";

import Icon from "@/components/icon";
import Link from "next/link";
import { NavItem } from "@/types/blocks/base";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function ({
  className,
  items,
  ...props
}: {
  className?: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col gap-1",
        className
      )}
      {...props}
    >
      {items.map((item, index) => {
        const href = item.url || "";
        const isActive =
          item.is_active || (href && pathname && pathname.startsWith(href));

        return (
        <Link
          key={index}
            href={href}
            aria-current={isActive ? "page" : undefined}
          className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              isActive && "bg-muted text-primary font-medium",
              className
          )}
        >
          {item.icon && <Icon name={item.icon} className="w-4 h-4" />}
            <span className="truncate">{item.title}</span>
        </Link>
        );
      })}
    </nav>
  );
}
