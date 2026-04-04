"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  BotMessageSquare,
  ChevronRight,
  LoaderCircle,
  MapPinned,
  MessageSquare,
  PenSquare,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function HomePageView({ locale }: { locale: string }) {
  const router = useRouter();
  const titleChars = React.useMemo(() => Array.from("杭艺云展"), []);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const introRef = React.useRef<HTMLDivElement | null>(null);
  const ambientRef = React.useRef<HTMLDivElement | null>(null);
  const spotlightRef = React.useRef<HTMLDivElement | null>(null);
  const titleShellRef = React.useRef<HTMLDivElement | null>(null);
  const titleGlowRef = React.useRef<HTMLDivElement | null>(null);
  const titleGhostRef = React.useRef<HTMLDivElement | null>(null);
  const titleRef = React.useRef<HTMLHeadingElement | null>(null);
  const titleCharRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const ctaRef = React.useRef<HTMLButtonElement | null>(null);
  const ctaGlowRef = React.useRef<HTMLSpanElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const menuLabelRef = React.useRef<HTMLDivElement | null>(null);
  const routeButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );
  const [phase, setPhase] = React.useState<"intro" | "menu">("intro");
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const items = React.useMemo<MenuItem[]>(
    () => [
      {
        key: "community",
        title: "社区",
        subtitle: "杭艺社区",
        href: `/${locale}/home/community`,
        icon: Users,
      },
      {
        key: "create",
        title: "云创",
        subtitle: "杭艺云创",
        href: `/${locale}/home/post`,
        icon: PenSquare,
      },
      {
        key: "ai",
        title: "小云 AI",
        subtitle: "智能共创",
        href: `/${locale}/home/ai-chat`,
        icon: BotMessageSquare,
      },
      {
        key: "exhibition",
        title: "线下展览",
        subtitle: "杭艺现场",
        href: `/${locale}/home/exhibition`,
        icon: MapPinned,
      },
      {
        key: "forum",
        title: "论坛",
        subtitle: "杭艺论坛",
        href: `/${locale}/home/forum`,
        icon: MessageSquare,
      },
    ],
    [locale]
  );

  const prefersReducedMotion = React.useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const getMenuButtons = React.useCallback(() => {
    return Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[data-home-menu-item]") ?? []
    );
  }, []);

  const showMenuImmediately = React.useCallback(() => {
    const menuButtons = getMenuButtons();

    setPhase("menu");
    gsap.set(overlayRef.current, { autoAlpha: 0, scaleY: 0 });
    gsap.set(introRef.current, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set([titleShellRef.current, ctaRef.current], {
      autoAlpha: 0,
      y: -16,
    });
    gsap.set(titleShellRef.current, { scale: 0.985, rotateX: 0, rotateY: 0, x: 0, y: 0 });
    gsap.set(titleGlowRef.current, { autoAlpha: 0.6, x: 0, y: 0, scale: 1 });
    gsap.set(titleGhostRef.current, { autoAlpha: 0.22, x: 0, y: 0, scale: 1 });
    gsap.set(ambientRef.current, { x: 0, y: 0, scale: 1, autoAlpha: 0.7 });
    gsap.set(spotlightRef.current, { x: 0, y: 0, scale: 1, autoAlpha: 0.5 });
    gsap.set(titleCharRefs.current, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      z: 0,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
    gsap.set(ctaGlowRef.current, { x: 0, y: 0, scale: 1, autoAlpha: 0.7 });
    gsap.set(menuRef.current, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      pointerEvents: "auto",
    });
    gsap.set(menuLabelRef.current, { autoAlpha: 1, y: 0 });
    gsap.set(menuButtons, { autoAlpha: 1, y: 0, scale: 1 });
  }, [getMenuButtons]);

  React.useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [items, router]);

  React.useLayoutEffect(() => {
    const menuButtons = getMenuButtons();

    const ctx = gsap.context(() => {
      gsap.set(overlayRef.current, {
        autoAlpha: 0,
        scaleY: 0,
        transformOrigin: "center bottom",
      });
      gsap.set(introRef.current, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(ambientRef.current, {
        autoAlpha: 0,
        scale: 0.92,
        x: 0,
        y: 0,
        force3D: true,
      });
      gsap.set(spotlightRef.current, {
        autoAlpha: 0,
        scale: 0.92,
        x: 0,
        y: 0,
        force3D: true,
      });
      gsap.set(titleShellRef.current, {
        y: 16,
        scale: 0.985,
        rotateX: -8,
        rotateY: 0,
        transformPerspective: 1400,
        transformOrigin: "center center",
        force3D: true,
      });
      gsap.set(titleGlowRef.current, {
        autoAlpha: 0,
        scale: 0.9,
        x: 0,
        y: 0,
        force3D: true,
      });
      gsap.set(titleGhostRef.current, {
        autoAlpha: 0,
        scale: 1.04,
        x: 0,
        y: 0,
      });
      gsap.set(titleCharRefs.current, {
        autoAlpha: 0,
        y: 34,
        z: -140,
        rotateX: -68,
        rotateY: 10,
        scale: 1.06,
        transformOrigin: "50% 50% -120px",
        force3D: true,
      });
      gsap.set(ctaRef.current, {
        autoAlpha: 0,
        y: 28,
        scale: 0.94,
        x: 0,
        force3D: true,
      });
      gsap.set(ctaGlowRef.current, {
        autoAlpha: 0,
        scale: 0.88,
        x: 0,
        y: 0,
        force3D: true,
      });
      gsap.set(menuRef.current, {
        autoAlpha: 0,
        y: 28,
        scale: 0.992,
        pointerEvents: "none",
        force3D: true,
      });
      gsap.set(menuLabelRef.current, {
        autoAlpha: 0,
        y: 18,
        force3D: true,
      });
      gsap.set(menuButtons, {
        autoAlpha: 0,
        y: 24,
        scale: 0.985,
        force3D: true,
      });

      if (prefersReducedMotion()) {
        gsap.set([ambientRef.current, spotlightRef.current], {
          autoAlpha: 1,
          scale: 1,
        });
        gsap.set(titleGhostRef.current, { autoAlpha: 0.18, scale: 1 });
        gsap.set(titleCharRefs.current, {
          autoAlpha: 1,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          scale: 1,
        });
        gsap.set(titleGlowRef.current, { autoAlpha: 0.55, scale: 1 });
        gsap.set(ctaRef.current, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(ctaGlowRef.current, { autoAlpha: 0.7, scale: 1 });
        return;
      }

      gsap
        .timeline({
          defaults: { ease: "expo.out" },
        })
        .to(
          [ambientRef.current, spotlightRef.current],
          {
            autoAlpha: 1,
            scale: 1,
            duration: 1.4,
            stagger: 0.08,
          },
          0
        )
        .to(
          titleGlowRef.current,
          {
            autoAlpha: 0.72,
            scale: 1,
            duration: 1.35,
          },
          0.04
        )
        .to(
          titleGhostRef.current,
          {
            autoAlpha: 1,
            scale: 1,
            duration: 1.5,
          },
          0.08
        )
        .to(
          titleShellRef.current,
          {
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 1.45,
          },
          0.12
        )
        .to(
          titleCharRefs.current,
          {
            autoAlpha: 1,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 1.22,
            stagger: 0.09,
          },
          0.16
        )
        .to(
          ctaGlowRef.current,
          {
            autoAlpha: 0.7,
            scale: 1,
            duration: 1.08,
          },
          0.4
        )
        .to(
          ctaRef.current,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1.02,
          },
          0.46
        )
        .to(
          ctaRef.current,
          {
            keyframes: [
              { y: -2, scale: 1.008, duration: 0.18, ease: "power2.out" },
              { y: 0, scale: 1, duration: 0.42, ease: "power3.out" },
            ],
          },
          1.08
        );
    }, rootRef);

    return () => ctx.revert();
  }, [getMenuButtons, prefersReducedMotion, titleChars]);

  React.useEffect(() => {
    if (
      prefersReducedMotion() ||
      !rootRef.current ||
      !titleShellRef.current ||
      !ctaRef.current
    ) {
      return;
    }

    const root = rootRef.current;
    const titleShell = titleShellRef.current;
    const ambient = ambientRef.current;
    const spotlight = spotlightRef.current;
    const titleGlow = titleGlowRef.current;
    const titleGhost = titleGhostRef.current;
    const cta = ctaRef.current;
    const ctaGlow = ctaGlowRef.current;
    const chars = titleCharRefs.current.filter(
      (node): node is HTMLSpanElement => Boolean(node)
    );

    const shellX = gsap.quickTo(titleShell, "x", {
      duration: 1.05,
      ease: "power3.out",
    });
    const shellY = gsap.quickTo(titleShell, "y", {
      duration: 1.05,
      ease: "power3.out",
    });
    const shellTiltX = gsap.quickTo(titleShell, "rotationX", {
      duration: 1.1,
      ease: "power3.out",
    });
    const shellTiltY = gsap.quickTo(titleShell, "rotationY", {
      duration: 1.1,
      ease: "power3.out",
    });
    const ambientX = ambient
      ? gsap.quickTo(ambient, "x", {
          duration: 1.35,
          ease: "power3.out",
        })
      : null;
    const ambientY = ambient
      ? gsap.quickTo(ambient, "y", {
          duration: 1.35,
          ease: "power3.out",
        })
      : null;
    const ambientScale = ambient
      ? gsap.quickTo(ambient, "scale", {
          duration: 1.45,
          ease: "power3.out",
        })
      : null;
    const spotlightX = spotlight
      ? gsap.quickTo(spotlight, "x", {
          duration: 1.1,
          ease: "power3.out",
        })
      : null;
    const spotlightY = spotlight
      ? gsap.quickTo(spotlight, "y", {
          duration: 1.1,
          ease: "power3.out",
        })
      : null;
    const glowX = titleGlow
      ? gsap.quickTo(titleGlow, "x", {
          duration: 1.2,
          ease: "power3.out",
        })
      : null;
    const glowY = titleGlow
      ? gsap.quickTo(titleGlow, "y", {
          duration: 1.2,
          ease: "power3.out",
        })
      : null;
    const glowScale = titleGlow
      ? gsap.quickTo(titleGlow, "scale", {
          duration: 1.3,
          ease: "power3.out",
        })
      : null;
    const glowOpacity = titleGlow
      ? gsap.quickTo(titleGlow, "autoAlpha", {
          duration: 1,
          ease: "power3.out",
        })
      : null;
    const ghostX = titleGhost
      ? gsap.quickTo(titleGhost, "x", {
          duration: 1.3,
          ease: "power3.out",
        })
      : null;
    const ghostY = titleGhost
      ? gsap.quickTo(titleGhost, "y", {
          duration: 1.3,
          ease: "power3.out",
        })
      : null;
    const ctaX = gsap.quickTo(cta, "x", {
      duration: 0.92,
      ease: "power3.out",
    });
    const ctaY = gsap.quickTo(cta, "y", {
      duration: 0.92,
      ease: "power3.out",
    });
    const ctaScale = gsap.quickTo(cta, "scale", {
      duration: 0.92,
      ease: "power3.out",
    });
    const ctaGlowX = ctaGlow
      ? gsap.quickTo(ctaGlow, "x", {
          duration: 1.02,
          ease: "power3.out",
        })
      : null;
    const ctaGlowY = ctaGlow
      ? gsap.quickTo(ctaGlow, "y", {
          duration: 1.02,
          ease: "power3.out",
        })
      : null;
    const ctaGlowScale = ctaGlow
      ? gsap.quickTo(ctaGlow, "scale", {
          duration: 1.08,
          ease: "power3.out",
        })
      : null;
    const charSetters = chars.map((char, index) => {
      const depth = index - (chars.length - 1) / 2;
      return {
        depth,
        x: gsap.quickTo(char, "x", {
          duration: 0.96,
          ease: "power3.out",
        }),
        y: gsap.quickTo(char, "y", {
          duration: 0.96,
          ease: "power3.out",
        }),
        rotateY: gsap.quickTo(char, "rotationY", {
          duration: 0.98,
          ease: "power3.out",
        }),
        rotateX: gsap.quickTo(char, "rotationX", {
          duration: 0.98,
          ease: "power3.out",
        }),
        z: gsap.quickTo(char, "z", {
          duration: 1,
          ease: "power3.out",
        }),
      };
    });

    const handlePointerMove = (event: PointerEvent) => {
      if (phase !== "intro") {
        return;
      }

      const rect = root.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const intensity = Math.min(1, Math.hypot(px * 1.5, py * 1.5));

      shellX(px * 22);
      shellY(py * 16);
      shellTiltX(py * -8);
      shellTiltY(px * 12);
      ambientX?.(px * 84);
      ambientY?.(py * 58);
      ambientScale?.(1.02 + intensity * 0.04);
      spotlightX?.(px * 110);
      spotlightY?.(py * 76);
      glowX?.(px * 42);
      glowY?.(py * 32);
      glowScale?.(1.03 + intensity * 0.06);
      glowOpacity?.(0.82);
      ghostX?.(px * -16);
      ghostY?.(py * -12);
      ctaX(px * 10);
      ctaY(py * 8);
      ctaScale(1.01 + intensity * 0.02);
      ctaGlowX?.(px * 18);
      ctaGlowY?.(py * 14);
      ctaGlowScale?.(1.04 + intensity * 0.08);
      charSetters.forEach((setter) => {
        setter.x(px * (10 + Math.abs(setter.depth) * 8) + setter.depth * px * 10);
        setter.y(py * (10 + Math.abs(setter.depth) * 4));
        setter.rotateY(px * (16 + setter.depth * 5));
        setter.rotateX(py * -10);
        setter.z(intensity * 34 - Math.abs(setter.depth) * 8);
      });
    };

    const handlePointerLeave = () => {
      shellX(0);
      shellY(0);
      shellTiltX(0);
      shellTiltY(0);
      ambientX?.(0);
      ambientY?.(0);
      ambientScale?.(1);
      spotlightX?.(0);
      spotlightY?.(0);
      glowX?.(0);
      glowY?.(0);
      glowScale?.(1);
      glowOpacity?.(0.6);
      ghostX?.(0);
      ghostY?.(0);
      ctaX(0);
      ctaY(0);
      ctaScale(1);
      ctaGlowX?.(0);
      ctaGlowY?.(0);
      ctaGlowScale?.(1);
      charSetters.forEach((setter) => {
        setter.x(0);
        setter.y(0);
        setter.rotateY(0);
        setter.rotateX(0);
        setter.z(0);
      });
    };

    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [phase, prefersReducedMotion]);

  const animateToMenu = React.useCallback(() => {
    if (phase === "menu" || pendingHref) {
      return;
    }

    const menuButtons = getMenuButtons();
    gsap.killTweensOf([
      overlayRef.current,
      introRef.current,
      ambientRef.current,
      spotlightRef.current,
      titleShellRef.current,
      titleGlowRef.current,
      titleGhostRef.current,
      titleRef.current,
      ...titleCharRefs.current,
      ctaRef.current,
      ctaGlowRef.current,
      menuRef.current,
      menuLabelRef.current,
      ...menuButtons,
    ]);

    if (prefersReducedMotion()) {
      showMenuImmediately();
      return;
    }

    setPhase("menu");
    gsap
      .timeline({
        defaults: { ease: "power4.inOut" },
      })
      .set(menuRef.current, {
        autoAlpha: 1,
        pointerEvents: "none",
      })
      .to(
        [ambientRef.current, spotlightRef.current],
        {
          autoAlpha: 0,
          scale: 0.96,
          duration: 0.52,
          stagger: 0.04,
        },
        0
      )
      .to(
        [titleGlowRef.current, titleGhostRef.current, ctaGlowRef.current],
        {
          autoAlpha: 0,
          scale: 0.94,
          duration: 0.5,
          stagger: 0.04,
        },
        0.02
      )
      .to(
        titleCharRefs.current,
        {
          autoAlpha: 0,
          y: -28,
          z: 80,
          rotateX: 28,
          duration: 0.54,
          stagger: {
            each: 0.04,
            from: "end",
          },
        },
        0.04
      )
      .to(
        [titleShellRef.current, ctaRef.current],
        {
          autoAlpha: 0,
          y: -18,
          duration: 0.46,
          stagger: 0.06,
        },
        0.08
      )
      .to(
        introRef.current,
        {
          autoAlpha: 0,
          duration: 0.34,
          pointerEvents: "none",
        },
        0.16
      )
      .to(
        menuRef.current,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.88,
          ease: "power3.out",
        },
        0.24
      )
      .to(
        menuLabelRef.current,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.64,
        },
        0.36
      )
      .to(
        menuButtons,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.76,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.42
      )
      .set(menuRef.current, { pointerEvents: "auto" });
  }, [getMenuButtons, pendingHref, phase, prefersReducedMotion, showMenuImmediately]);

  const animateNavigate = React.useCallback(
    (href: string) => {
      if (pendingHref || phase !== "menu") {
        return;
      }

      const menuButtons = getMenuButtons();
      const activeButton = routeButtonRefs.current[href];
      const inactiveButtons = menuButtons.filter((button) => button !== activeButton);
      setPendingHref(href);

      gsap.killTweensOf([
        overlayRef.current,
        menuLabelRef.current,
        menuRef.current,
        ...menuButtons,
      ]);

      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      gsap
        .timeline({
          defaults: { ease: "power4.inOut" },
          onComplete: () => {
            router.push(href);
          },
        })
        .to(
          inactiveButtons,
          {
            autoAlpha: 0,
            y: -18,
            scale: 0.985,
            duration: 0.34,
            stagger: {
              each: 0.04,
              from: "end",
            },
          },
          0
        )
        .to(
          menuLabelRef.current,
          {
            autoAlpha: 0,
            y: -12,
            duration: 0.32,
          },
          0.02
        )
        .to(
          activeButton ?? menuRef.current,
          {
            autoAlpha: 0,
            y: -12,
            scale: 0.985,
            duration: 0.38,
          },
          0.1
        )
        .to(
          overlayRef.current,
          {
            autoAlpha: 1,
            scaleY: 1,
            transformOrigin: "center bottom",
            duration: 0.82,
          },
          0.06
        );
    },
    [getMenuButtons, pendingHref, phase, prefersReducedMotion, router]
  );

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-full w-full items-center justify-center overflow-hidden"
    >
      <div
        ref={overlayRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(246,250,248,0.94),rgba(232,240,236,0.98))] dark:bg-[linear-gradient(180deg,rgba(7,13,15,0.92),rgba(10,18,21,0.98))]"
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,197,164,0.09),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(15,23,42,0.08),transparent_42%),linear-gradient(180deg,rgba(251,253,252,0.98),rgba(243,248,246,0.96))] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(45,212,191,0.16),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(15,23,42,0.22),transparent_42%),linear-gradient(180deg,rgba(7,13,15,0.98),rgba(10,18,21,0.96))]" />
        <div
          ref={ambientRef}
          className="absolute left-1/2 top-[14%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.14),rgba(125,211,252,0.08)_34%,transparent_70%)] opacity-70 blur-3xl will-change-transform dark:bg-[radial-gradient(circle,rgba(45,212,191,0.2),rgba(56,189,248,0.12)_34%,transparent_70%)]"
        />
        <div
          ref={spotlightRef}
          className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42),rgba(255,255,255,0.12)_24%,transparent_58%)] opacity-50 mix-blend-soft-light blur-3xl will-change-transform dark:bg-[radial-gradient(circle,rgba(148,250,229,0.16),rgba(45,212,191,0.08)_26%,transparent_58%)]"
        />
        <div className="absolute inset-x-[10%] top-[10%] h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="absolute inset-x-[16%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent dark:via-white/12" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl items-center justify-center px-6 py-12 md:px-10">
        <div
          ref={introRef}
          aria-hidden={phase !== "intro"}
          className={cn(
            "absolute inset-0 flex w-full flex-col items-center justify-center text-center will-change-[transform,opacity,filter]"
          )}
          style={{ perspective: "1400px" }}
        >
          <div
            ref={titleShellRef}
            className="relative will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={titleGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-28%_-12%] -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),rgba(125,211,252,0.12)_38%,transparent_72%)] opacity-70 blur-3xl will-change-transform dark:bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.24),rgba(56,189,248,0.14)_38%,transparent_72%)]"
            />
            <div
              ref={titleGhostRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-[1] scale-[1.03] text-5xl font-semibold tracking-[0.42em] text-primary/12 blur-[16px] will-change-transform dark:text-emerald-200/14 md:text-7xl"
              style={{ fontFamily: "var(--font-display-cn)" }}
            >
              杭艺云展
            </div>
            <h1
              ref={titleRef}
              className="select-none text-5xl font-semibold tracking-[0.42em] text-foreground [text-shadow:0_18px_36px_rgba(15,23,42,0.08)] dark:text-slate-100 dark:[text-shadow:0_20px_44px_rgba(0,0,0,0.34)] md:text-7xl"
              style={{ fontFamily: "var(--font-display-cn)" }}
            >
              {titleChars.map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  ref={(node) => {
                    titleCharRefs.current[index] = node;
                  }}
                  className="inline-block will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>

          <button
            ref={ctaRef}
            type="button"
            onClick={animateToMenu}
            disabled={Boolean(pendingHref)}
            className="relative mt-12 inline-flex will-change-transform items-center gap-2 overflow-hidden rounded-full border border-primary/18 bg-white/72 px-7 py-3 text-sm tracking-[0.26em] text-primary shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-md transition hover:border-primary/28 hover:bg-white/88 dark:border-white/12 dark:bg-white/6 dark:text-emerald-300 dark:shadow-[0_18px_40px_rgba(0,0,0,0.24)] dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <span
              ref={ctaGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),rgba(255,255,255,0.12)_32%,transparent_66%)] will-change-transform dark:bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.22),rgba(255,255,255,0.08)_32%,transparent_66%)]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[1px] rounded-full border border-white/20 opacity-60 dark:border-white/10"
            />
            <span className="relative">开始逛展</span>
            <ChevronRight className="relative h-4 w-4" />
          </button>
        </div>

        <div
          ref={menuRef}
          aria-hidden={phase !== "menu"}
          className={cn(
            "flex w-full flex-col items-center justify-center will-change-transform"
          )}
        >
          <div
            ref={menuLabelRef}
            className="mb-12 text-center text-xs tracking-[0.52em] text-muted-foreground dark:text-slate-400"
          >
            HANGYI CLOUD EXPO
          </div>

          <div className="flex w-full max-w-2xl flex-col">
            {items.map((item) => {
              const Icon = item.icon;
              const isPending = pendingHref === item.href;

              return (
                <button
                  key={item.key}
                  ref={(node) => {
                    routeButtonRefs.current[item.href] = node;
                  }}
                  data-home-menu-item="true"
                  type="button"
                  onClick={() => animateNavigate(item.href)}
                  disabled={Boolean(pendingHref)}
                  className="group relative flex w-full items-center justify-between overflow-hidden border-t border-foreground/10 py-6 text-left transition disabled:cursor-wait disabled:opacity-80 last:border-b hover:border-primary/20 dark:border-white/10 dark:hover:border-emerald-300/24"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-2 left-0 w-[46%] -translate-x-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02),transparent)] opacity-0 blur-2xl transition duration-500 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-[linear-gradient(90deg,rgba(45,212,191,0.16),rgba(255,255,255,0.03),transparent)]"
                  />
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/12 bg-white/72 text-primary shadow-sm transition duration-500 group-hover:scale-[1.04] group-hover:border-primary/20 group-hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-emerald-300 dark:shadow-none dark:group-hover:border-emerald-300/24 dark:group-hover:bg-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span
                        className="text-2xl font-medium tracking-[0.14em] text-foreground transition duration-500 group-hover:translate-x-1 dark:text-slate-100 md:text-3xl"
                        style={{ fontFamily: "var(--font-display-cn)" }}
                      >
                        {item.title}
                      </span>
                      <span className="text-[11px] tracking-[0.34em] text-muted-foreground transition duration-500 group-hover:text-primary/80 dark:text-slate-500 dark:group-hover:text-emerald-300/80">
                        {item.subtitle}
                      </span>
                    </span>
                  </div>

                  <span className="text-sm tracking-[0.24em] text-muted-foreground transition duration-500 group-hover:text-primary dark:text-slate-500 dark:group-hover:text-emerald-300">
                    {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "进入"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
