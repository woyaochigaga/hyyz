"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export default function HomeRouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const veilRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const isHomeRoot = /\/home\/?$/.test(pathname || "");

  React.useLayoutEffect(() => {
    if (isHomeRoot || !rootRef.current || !veilRef.current || !contentRef.current) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      gsap.set(rootRef.current, { autoAlpha: 1 });
      gsap.set(veilRef.current, { autoAlpha: 0 });
      gsap.set(contentRef.current, { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(rootRef.current, { autoAlpha: 1 });
      gsap.set(veilRef.current, {
        autoAlpha: 1,
        scaleY: 1,
        transformOrigin: "center bottom",
      });
      gsap.set(contentRef.current, {
        autoAlpha: 0,
        y: 22,
        scale: 0.992,
        force3D: true,
      });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
        })
        .to(
          contentRef.current,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.82,
          },
          0.16
        )
        .to(veilRef.current, {
          autoAlpha: 0,
          scaleY: 0,
          transformOrigin: "center top",
          duration: 0.88,
          ease: "power4.inOut",
        }, 0);
    }, rootRef);

    return () => ctx.revert();
  }, [isHomeRoot, pathname]);

  if (isHomeRoot) {
    return <>{children}</>;
  }

  return (
    <div ref={rootRef} className="relative h-full min-h-0 w-full">
      <div
        ref={veilRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[2rem] bg-[linear-gradient(180deg,rgba(246,250,248,0.92),rgba(232,240,236,0.98))] opacity-100 origin-bottom dark:bg-[linear-gradient(180deg,rgba(7,13,15,0.9),rgba(10,18,21,0.98))]"
      />
      <div
        ref={contentRef}
        className="relative h-full min-h-0 w-full translate-y-6 scale-[0.992] opacity-0 will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
