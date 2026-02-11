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

        <div className="relative mx-auto w-full px-4 md:max-w-7xl">
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-8">
              <img
                src="/imgs/badges/phdaily.svg"
                alt="phdaily"
                className="h-10 object-cover"
              />
            </div>
          )}
          <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center gap-6 px-4 text-center lg:min-h-[520px]">
            {texts && texts.length > 1 ? (
              <h1 className="hero-title mx-auto text-balance text-4xl font-semibold tracking-[0.18em] lg:text-6xl">
                {texts[0]}
                <span
                  className="ink-highlight-img mt-[-0.7rem] mr-[-1.2rem]"
                  role="img"
                  aria-label={highlightText || "highlight"}
                />
                {texts[1]}
              </h1>
            ) : (
              <h1 className="hero-title mx-auto text-balance text-5xl font-semibold tracking-[0.18em] lg:text-6xl">
                {hero.title}
              </h1>
            )}

            <p
              className="hero-subtitle m mx-auto max-w-3xl text-slate-100/90 lg:text-xl"
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
