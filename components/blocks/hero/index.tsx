import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import CloudInkIcon from "@/components/icon/cloud-ink";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Hero({
  hero,
  sectionClassName,
}: {
  hero: HeroType;
  sectionClassName?: string;
}) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden py-24 text-white",
          sectionClassName
        )}
      >
        <div
          className="hero-bg-slideshow pointer-events-none"
          aria-hidden="true"
        >
          <div className="hero-bg-slide hero-bg-slide-1" />
          <div className="hero-bg-slide hero-bg-slide-2" />
          <div className="hero-bg-slide hero-bg-slide-3" />
          <div className="hero-bg-slide hero-bg-slide-4" />
          <div className="hero-bg-slide hero-bg-slide-5" />
          <div className="hero-bg-overlay" />
        </div>

        <div className="relative mx-auto w-full px-3 sm:px-4 md:max-w-7xl">
          {hero.show_badge && (
            <div className="mb-6 flex items-center justify-center sm:mb-8">
              <img
                src="/imgs/badges/phdaily.svg"
                alt="phdaily"
                className="h-10 object-cover"
              />
            </div>
          )}
          <div className="mx-auto flex min-h-[min(52dvh,360px)] max-w-5xl flex-col items-center justify-center gap-4 px-2 py-8 text-center sm:min-h-[400px] sm:gap-6 sm:px-4 sm:py-12 lg:min-h-[520px] lg:gap-6">
            {texts && texts.length > 1 ? (
              <h1 className="hero-title mx-auto max-w-[22rem] text-balance text-[1.6rem] font-semibold leading-tight tracking-[0.06em] sm:max-w-none sm:text-3xl sm:tracking-[0.12em] lg:text-6xl lg:tracking-[0.18em]">
                {texts[0]}
                <span
                  className="ink-highlight-img mt-[-0.7rem] mr-[-1.2rem] inline-block align-middle max-sm:scale-90"
                  role="img"
                  aria-label={highlightText || "highlight"}
                />
                {texts[1]}
              </h1>
            ) : (
              <h1 className="hero-title mx-auto max-w-[20rem] text-balance text-[1.65rem] font-semibold leading-tight tracking-[0.06em] sm:max-w-none sm:text-4xl sm:tracking-[0.12em] lg:text-6xl lg:tracking-[0.18em]">
                {hero.title}
              </h1>
            )}

            <p
              className="hero-subtitle mx-auto max-w-3xl text-slate-100/90 lg:text-xl"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            {hero.buttons && (
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                {hero.buttons.map((item, i) => {
                  return (
                    <Link
                      key={i}
                      href={item.url || ""}
                      target={item.target || ""}
                      className="flex items-center"
                    >
                      <Button
                        className="w-full"
                        size="lg"
                        variant={item.variant || "default"}
                      >
                        {item.title}
                        {item.icon && (
                          <CloudInkIcon className="ml-1.5" />
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {hero.hero_footer && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4">
            <p className="hero-footer-text max-w-4xl text-center">
              {hero.hero_footer}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
