import { getTranslations } from "next-intl/server";

/** i18n keys under `home.category.*` — order defines tab order */
const CATEGORY_KEYS = [
  "all",
  "open_class",
  "games",
  "anime",
  "music",
  "film",
  "food",
  "knowledge",
  "skits",
  "life",
  "sports",
] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage() {
  const t = await getTranslations("home");

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-3 pb-6 pt-2">
      {/* 框 1：顶部分类条（Douyin 式横向 Tab） */}
      <div className="rounded-lg border-2 border-red-500 bg-background/80 px-2 py-2 lg:px-3">
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          aria-label={t("categories_nav")}
        >
          {CATEGORY_KEYS.map((key, i) => (
            <button
              key={key}
              type="button"
              className={
                i === 0
                  ? "relative pb-1 font-medium text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-red-500"
                  : "pb-1 text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {t(`category.${key}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* 框 2：主内容区 — 首行左大右双叠，下方多行五列 */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border-2 border-red-500 bg-background/50 p-2 lg:p-3">
        {/* 首行：约 62% 特色大卡 + 38% 右侧上下两卡 */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-3">
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-red-400/80 bg-muted/30 text-sm text-muted-foreground lg:min-h-[220px]">
            主题内容 · 左侧大卡（约 60–65% 宽）
          </div>
          <div className="flex min-h-[180px] flex-col gap-3 lg:min-h-[220px]">
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-red-400/80 bg-muted/30 text-sm text-muted-foreground">
              主题内容 · 右上
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-red-400/80 bg-muted/30 text-sm text-muted-foreground">
              主题内容 · 右下
            </div>
          </div>
        </div>

        {/* 下方：每行 5 等分（窄屏先 2→3→5 列，避免挤爆） */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-xl border border-dashed border-red-400/70 bg-muted/20 text-center text-xs text-muted-foreground flex items-center justify-center p-2"
            >
              卡片 {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
