"use client";

"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Bell,
  Bot,
  CreditCard,
  Eye,
  FilePenLine,
  FileText,
  GalleryHorizontal,
  House,
  Image,
  KeyRound,
  MapPin,
  MessageSquareText,
  Plus,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  RiAddLine: Plus,
  RiArticleLine: FileText,
  RiBankCardLine: CreditCard,
  RiChat3Line: MessageSquareText,
  RiEditLine: FilePenLine,
  RiEyeLine: Eye,
  RiFileList3Line: FileText,
  RiGalleryLine: GalleryHorizontal,
  RiHomeLine: House,
  RiImageLine: Image,
  RiKey2Line: KeyRound,
  RiMapPinLine: MapPin,
  RiNotification3Line: Bell,
  RiOrderPlayLine: UserRound,
  RiRobot2Line: Bot,
  RiShieldCheckLine: ShieldCheck,
  RiUserLine: User,
};

export default function Icon({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}
