"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { NavItem } from "@/types/blocks/base";

export default function ({ items }: { items: NavItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {items.map((item) => {
          return (
            <DropdownMenuItem key={item.title} asChild>
              <Link
                href={item.url || "#"}
                target={item.target || "_self"}
                rel={item.target === "_blank" ? "noreferrer" : undefined}
                className="flex w-full items-center gap-2"
              >
                {item.icon && <Icon name={item.icon} className="h-4 w-4" />}
                {item.title}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
