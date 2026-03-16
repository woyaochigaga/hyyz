//弹窗通知组件，使用sonner库


import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type NotifyType = "success" | "error" | "info" | "warning";

const TYPE_STYLES: Record<
  NotifyType,
  {
    dotClass: string;
    iconWrapClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  success: {
    dotClass: "bg-emerald-500",
    iconWrapClass: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    Icon: CheckCircle2,
  },
  error: {
    dotClass: "bg-red-500",
    iconWrapClass: "bg-red-500/12 text-red-700 dark:text-red-300",
    Icon: AlertCircle,
  },
  info: {
    dotClass: "bg-sky-500",
    iconWrapClass: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    Icon: Info,
  },
  warning: {
    dotClass: "bg-amber-500",
    iconWrapClass: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
    Icon: AlertTriangle,
  },
};

export function notify(type: NotifyType, message: string) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.info;

  toast.custom(
    () => (
      <div className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/60 bg-background/90 shadow-lg shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:shadow-black/30">
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", style.dotClass)} />
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10",
                style.iconWrapClass
              )}
            >
              <style.Icon className="h-5 w-5" />
            </span>
          </div>

          <p className="pt-1 text-sm font-medium leading-snug text-foreground">
            {message}
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      className:
        "w-full flex justify-center !bg-transparent !border-0 !shadow-none p-0",
    }
  );
}

