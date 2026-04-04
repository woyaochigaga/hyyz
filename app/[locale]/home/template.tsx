import { ReactNode } from "react";
import HomeRouteTransition from "@/components/home/home-route-transition";

export default function HomeTemplate({ children }: { children: ReactNode }) {
  return <HomeRouteTransition>{children}</HomeRouteTransition>;
}
