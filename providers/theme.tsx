"use client";

import { CacheKey } from "@/services/constant";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { cacheGet } from "@/lib/cache";
import { useAppContext } from "@/contexts/app";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const Analytics = dynamic(() => import("@/components/analytics"), {
  ssr: false,
});

const SignModal = dynamic(() => import("@/components/sign/modal"), {
  ssr: false,
});

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme, setTheme } = useAppContext();

  useEffect(() => {
    const themeInCache = cacheGet(CacheKey.Theme);
    if (themeInCache) {
      // theme setted
      if (["dark", "light"].includes(themeInCache)) {
        setTheme(themeInCache);
        return;
      }
    } else {
      // theme not set
      const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME;
      if (defaultTheme && ["dark", "light"].includes(defaultTheme)) {
        setTheme(defaultTheme);
        return;
      }
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = () => {
      setTheme(mediaQuery.matches ? "dark" : "light");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  return (
    <NextThemesProvider forcedTheme={theme} {...props}>
      {children}

      <Toaster position="top-center" richColors />
      <SignModal />
      <Analytics />
    </NextThemesProvider>
  );
}
