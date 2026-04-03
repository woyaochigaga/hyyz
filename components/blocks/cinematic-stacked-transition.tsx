"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

type CinematicSection = {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  bg: string;
};

const ZH_SECTIONS: CinematicSection[] = [
  {
    tag: "序章 / PROLOGUE",
    title: "杭艺云展",
    subtitle: "看见杭州工艺的当代表达",
    description:
      "以数字策展串联地域工艺、器物之美与匠人精神，让传统技艺在屏幕之上获得新的观看方式。",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E5%BE%84%E5%B1%B1%E8%8C%B6%E7%AD%85.jpeg",
  },
  {
    tag: "展陈 / EXHIBITION",
    title: "径山茶筅",
    subtitle: "茶事礼序中的手作节奏",
    description:
      "细密竹丝在手中成形，承载宋韵茶礼的仪式感，也让传统茶文化在当代视觉中重新被感知。",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E9%99%B6%E7%93%B7.jpeg",
  },
  {
    tag: "工艺 / CRAFT",
    title: "陶瓷",
    subtitle: "火与土淬炼出的器物温度",
    description:
      "从拉坯到入窑，器形、釉色与手感共同构成陶瓷之美，呈现日常器物背后的时间与技艺。",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E8%89%AF%E6%B8%9A%E7%8E%89%E9%9B%95.jpeg",
  },
  {
    tag: "互动 / INTERACTION",
    title: "良渚玉雕",
    subtitle: "在玉石纹理中延续古老文明",
    description:
      "以刀为笔、以玉为纸，在温润材质中雕刻礼制、信仰与审美，映照良渚文化的深厚底蕴。",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E4%BD%99%E6%9D%AD%E7%BA%B8%E4%BC%9E.jpeg",
  },
  {
    tag: "终章 / FINALE",
    title: "器物日常",
    subtitle: "让传统工艺回到生活现场",
    description:
      "纸伞的轻盈、器碗的圆润，都让东方手作美学在日常使用中被重新理解，也让工艺重新贴近当代生活。",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E7%A2%97.jpeg",
  },
];

const EN_SECTIONS: CinematicSection[] = [
  {
    tag: "PROLOGUE",
    title: "Hangyi Cloud Expo",
    subtitle: "Contemporary views on Hangzhou craft",
    description:
      "Digital curation connects local craftsmanship, object culture, and maker spirit, giving traditional techniques a new stage on screen.",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E5%BE%84%E5%B1%B1%E8%8C%B6%E7%AD%85.jpeg",
  },
  {
    tag: "EXHIBITION",
    title: "Jingshan Tea Whisk",
    subtitle: "Handmade rhythm within tea ritual",
    description:
      "Fine bamboo strands take shape by hand, carrying the ceremonial grace of tea culture into a contemporary visual experience.",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E9%99%B6%E7%93%B7.jpeg",
  },
  {
    tag: "CRAFT",
    title: "Ceramics",
    subtitle: "Warmth shaped by earth and fire",
    description:
      "From wheel throwing to kiln firing, form, glaze, and touch reveal the time and technique embedded in everyday vessels.",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E8%89%AF%E6%B8%9A%E7%8E%89%E9%9B%95.jpeg",
  },
  {
    tag: "INTERACTION",
    title: "Liangzhu Jade Carving",
    subtitle: "Ancient civilization carved in stone",
    description:
      "Using the blade like a pen, jade carving preserves ritual, belief, and refinement in a material long tied to Liangzhu heritage.",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E4%BD%99%E6%9D%AD%E7%BA%B8%E4%BC%9E.jpeg",
  },
  {
    tag: "FINALE",
    title: "Craft in Daily Life",
    subtitle: "Traditional objects, still fully alive",
    description:
      "The lightness of paper umbrellas and the rounded calm of bowls bring craft back into daily life, where use and beauty remain inseparable.",
    bg: "https://hyyz-1417241936.cos.ap-shanghai.myqcloud.com/craft/%E7%A2%97.jpeg",
  },
];

export default function CinematicStackedTransition({ locale }: { locale: string }) {
  const sections = useMemo(
    () => (locale.startsWith("zh") ? ZH_SECTIONS : EN_SECTIONS),
    [locale]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const bgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const floatRefs = useRef<Array<HTMLDivElement | null>>([]);
  const glowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const enteredRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    sectionRefs.current.forEach((section, index) => {
      const bg = bgRefs.current[index];
      const content = contentRefs.current[index];
      const glow = glowRefs.current[index];
      if (!section || !bg || !content) return;
      gsap.set(bg, { scale: 1.1, x: 0, y: 0 });
      gsap.set(content, { y: 50, autoAlpha: 0 });
      if (glow) gsap.set(glow, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.65) return;
          const index = Number((entry.target as HTMLElement).dataset.index ?? 0);
          setActiveIndex(index);

          const bg = bgRefs.current[index];
          const content = contentRefs.current[index];
          if (!bg || !content) return;

          if (!enteredRef.current[index]) {
            enteredRef.current[index] = true;
            gsap.to(content, {
              duration: 0.9,
              y: 0,
              autoAlpha: 1,
              ease: "power3.out",
            });
          }
        });
      },
      { threshold: [0.65, 0.85] }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    sectionRefs.current.forEach((section, index) => {
      const bg = bgRefs.current[index];
      const content = contentRefs.current[index];
      const float = floatRefs.current[index];
      const glow = glowRefs.current[index];
      if (!section || !bg || !content || !float || !glow) return;

      const setBgX = gsap.quickTo(bg, "x", { duration: 0.6, ease: "power3.out" });
      const setBgY = gsap.quickTo(bg, "y", { duration: 0.6, ease: "power3.out" });
      const setContentX = gsap.quickTo(content, "x", { duration: 0.7, ease: "power3.out" });
      const setContentY = gsap.quickTo(content, "y", { duration: 0.7, ease: "power3.out" });
      const setGlowX = gsap.quickTo(glow, "x", { duration: 0.9, ease: "power3.out" });
      const setGlowY = gsap.quickTo(glow, "y", { duration: 0.9, ease: "power3.out" });
      const setGlowScale = gsap.quickTo(glow, "scale", { duration: 1, ease: "power3.out" });
      const setBgRotate = gsap.quickTo(bg, "rotate", { duration: 0.8, ease: "power3.out" });
      const setContentRotate = gsap.quickTo(content, "rotate", { duration: 0.8, ease: "power3.out" });

      const onMouseMove = (event: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

        setBgX(nx * -12);
        setBgY(ny * -10);
        setContentX(nx * 10);
        setContentY(ny * 8);
        setGlowX(nx * 18);
        setGlowY(ny * 16);
      };

      const onMouseLeave = () => {
        setBgX(0);
        setBgY(0);
        setContentX(0);
        setContentY(0);
        setGlowX(0);
        setGlowY(0);
      };

      let wheelResetTimer: ReturnType<typeof window.setTimeout> | null = null;
      const onWheel = (event: WheelEvent) => {
        const rect = section.getBoundingClientRect();
        const sectionVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (!sectionVisible) return;

        const deltaY = gsap.utils.clamp(-120, 120, event.deltaY);
        const deltaX = gsap.utils.clamp(-80, 80, event.deltaX);
        const intensity = Math.max(Math.abs(deltaY), Math.abs(deltaX));

        setBgY(gsap.utils.clamp(-32, 32, deltaY * -0.18));
        setBgX(gsap.utils.clamp(-20, 20, deltaX * -0.18));
        setBgRotate(gsap.utils.clamp(-2.5, 2.5, deltaY * -0.012));
        setContentY(gsap.utils.clamp(-28, 28, deltaY * 0.12));
        setContentX(gsap.utils.clamp(-18, 18, deltaX * 0.14));
        setContentRotate(gsap.utils.clamp(-1.8, 1.8, deltaY * 0.009));
        setGlowY(gsap.utils.clamp(-42, 42, deltaY * -0.24));
        setGlowX(gsap.utils.clamp(-30, 30, deltaX * -0.22));
        setGlowScale(gsap.utils.clamp(1, 1.12, 1 + intensity / 1000));

        if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
        wheelResetTimer = window.setTimeout(() => {
          setBgX(0);
          setBgY(0);
          setBgRotate(0);
          setContentX(0);
          setContentY(0);
          setContentRotate(0);
          setGlowX(0);
          setGlowY(0);
          setGlowScale(1);
        }, 160) as unknown as ReturnType<typeof window.setTimeout>;
      };

      const onScroll = () => {
        const rect = section.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const sectionCenter = rect.top + rect.height / 2;
        const distance = (sectionCenter - viewportCenter) / window.innerHeight;
        gsap.to(float, {
          y: gsap.utils.clamp(-24, 24, -distance * 40),
          rotate: gsap.utils.clamp(-2.5, 2.5, -distance * 4),
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      section.addEventListener("mousemove", onMouseMove);
      section.addEventListener("mouseleave", onMouseLeave);
      section.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      cleanups.push(() => {
        section.removeEventListener("mousemove", onMouseMove);
        section.removeEventListener("mouseleave", onMouseLeave);
        section.removeEventListener("wheel", onWheel);
        window.removeEventListener("scroll", onScroll);
        if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [sections]);

  return (
    <section className="relative w-full">
      {sections.map((item, index) => (
        <article
          key={item.title}
          data-index={index}
          ref={(node) => {
            sectionRefs.current[index] = node;
          }}
          className="relative h-[100svh] min-h-[560px] w-full overflow-hidden"
        >
          <div
            ref={(node) => {
              bgRefs.current[index] = node;
            }}
            className="absolute -inset-8 bg-cover bg-center bg-no-repeat will-change-transform md:-inset-10"
            style={{ backgroundImage: `url(${item.bg})` }}
          />
          <div
            ref={(node) => {
              glowRefs.current[index] = node;
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[42vh] w-[42vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.08)_28%,rgba(255,255,255,0)_72%)] opacity-80 mix-blend-screen blur-2xl will-change-transform"
          />
          <div
            className={`pointer-events-none absolute inset-0 ${
              index % 2 === 0
                ? "bg-[linear-gradient(90deg,rgba(5,10,18,0.82)_0%,rgba(5,10,18,0.68)_24%,rgba(5,10,18,0.28)_46%,rgba(5,10,18,0)_72%)]"
                : "bg-[linear-gradient(270deg,rgba(5,10,18,0.82)_0%,rgba(5,10,18,0.68)_24%,rgba(5,10,18,0.28)_46%,rgba(5,10,18,0)_72%)]"
            }`}
          />
          <div
            className="absolute inset-0 bg-black/45"
          />

          <div
            className={`relative z-10 flex h-full w-full items-end p-6 md:p-12 lg:p-16 ${
              index % 2 === 0 ? "justify-start" : "justify-end"
            }`}
          >
            <div
              ref={(node) => {
                contentRefs.current[index] = node;
              }}
              className={`max-w-2xl space-y-4 text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] will-change-transform ${
                index % 2 === 0 ? "text-left" : "text-right"
              }`}
            >
              <div
                ref={(node) => {
                  floatRefs.current[index] = node;
                }}
                className={`mb-4 inline-flex rounded-full border border-white/35 bg-white/8 px-4 py-2 text-xs tracking-[0.2em] text-white/80 backdrop-blur ${
                  index % 2 === 0 ? "" : "ml-auto"
                }`}
              >
                {locale.startsWith("zh") ? "沉浸交互体验" : "IMMERSIVE INTERACTION"}
              </div>
              <p className="text-xs tracking-[0.25em] text-white/80 md:text-sm">{item.tag}</p>
              <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{item.title}</h2>
              <h3 className="text-lg text-white/95 md:text-2xl">{item.subtitle}</h3>
              <p
                className={`text-sm leading-7 text-white/90 md:text-base ${
                  index % 2 === 0 ? "max-w-xl" : "ml-auto max-w-xl"
                }`}
              >
                {item.description}
              </p>
              <p className="pt-3 text-xs uppercase tracking-[0.3em] text-white/65">
                {String(index + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </article>
      ))}

      <div className="pointer-events-none fixed right-6 top-1/2 z-40 -translate-y-1/2 space-y-2">
        {sections.map((_, index) => (
          <div
            key={`dot-${index}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
              index === activeIndex ? "scale-125 bg-white shadow-[0_0_14px_rgba(255,255,255,0.7)]" : "bg-white/35"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
