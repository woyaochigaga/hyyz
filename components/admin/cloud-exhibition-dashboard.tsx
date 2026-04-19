"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { init, use, type ComposeOption, type EChartsType } from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

use([GridComponent, LegendComponent, TooltipComponent, BarChart, LineChart, PieChart, CanvasRenderer]);

type ChartOption = ComposeOption<
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
>;

type MetricItem = {
  label: string;
  value: number;
  format?: "number" | "currency" | "percent";
  description: string;
};

type TrendChart = {
  title: string;
  description: string;
  labels: string[];
  series: Array<{
    name: string;
    data: number[];
    color: string;
  }>;
};

type PieChartData = {
  title: string;
  description: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  colors: string[];
};

type BarChartData = {
  title: string;
  description: string;
  labels: string[];
  series: Array<{
    name: string;
    data: number[];
    color: string;
  }>;
};

type ModuleSection = {
  key:
    | "users"
    | "shops"
    | "community"
    | "forum"
    | "exhibitions"
    | "announcements"
    | "orders";
  title: string;
  description: string;
  accent: string;
  metrics: MetricItem[];
  charts: Array<
    | {
        kind: "line";
        payload: TrendChart;
      }
    | {
        kind: "bar";
        payload: BarChartData;
      }
    | {
        kind: "pie";
        payload: PieChartData;
      }
  >;
  links: Array<{
    label: string;
    href: string;
    value: string;
  }>;
};

type Overview = {
  title: string;
  summary: string;
  highlights: MetricItem[];
  lastUpdatedAt?: string;
};

export type CloudExhibitionDashboardData = {
  overview: Overview;
  modules: ModuleSection[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatMetricValue(value: number, format: MetricItem["format"] = "number") {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

function formatDateTime(value?: string) {
  if (!value) return "暂无";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getChartBaseOption(): Pick<ChartOption, "tooltip" | "legend" | "grid"> {
  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderWidth: 0,
      textStyle: {
        color: "#f8fafc",
      },
    },
    legend: {
      top: 0,
      textStyle: {
        color: "#64748b",
      },
    },
    grid: {
      top: 52,
      left: 18,
      right: 18,
      bottom: 12,
      containLabel: true,
    },
  };
}

function EChart({ option, height = 300 }: { option: ChartOption; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = chartRef.current || init(containerRef.current);
    chartRef.current = chart;
    chart.setOption(option, true);

    const resize = () => {
      chart.resize();
    };

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            chart.resize();
          })
        : null;

    observer?.observe(containerRef.current);
    window.addEventListener("resize", resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}

function buildLineOption(chart: TrendChart): ChartOption {
  return {
    ...getChartBaseOption(),
    color: chart.series.map((item) => item.color),
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chart.labels,
      axisLine: {
        lineStyle: {
          color: "#cbd5e1",
        },
      },
      axisLabel: {
        color: "#64748b",
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
      axisLabel: {
        color: "#64748b",
      },
    },
    series: chart.series.map((item) => ({
      name: item.name,
      type: "line",
      smooth: true,
      symbolSize: 7,
      areaStyle: {
        opacity: 0.08,
      },
      data: item.data,
    })),
  };
}

function buildBarOption(chart: BarChartData): ChartOption {
  return {
    ...getChartBaseOption(),
    color: chart.series.map((item) => item.color),
    tooltip: {
      ...getChartBaseOption().tooltip,
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    xAxis: {
      type: "category",
      data: chart.labels,
      axisLine: {
        lineStyle: {
          color: "#cbd5e1",
        },
      },
      axisLabel: {
        color: "#64748b",
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
      axisLabel: {
        color: "#64748b",
      },
    },
    series: chart.series.map((item) => ({
      name: item.name,
      type: "bar",
      barMaxWidth: 28,
      data: item.data,
    })),
  };
}

function buildPieOption(chart: PieChartData): ChartOption {
  return {
    color: chart.colors,
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderWidth: 0,
      textStyle: {
        color: "#f8fafc",
      },
    },
    legend: {
      top: 0,
      textStyle: {
        color: "#64748b",
      },
    },
    series: [
      {
        type: "pie",
        radius: ["44%", "72%"],
        center: ["50%", "58%"],
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2,
        },
        label: {
          color: "#475569",
          formatter: "{b}\n{d}%",
        },
        data: chart.data,
      },
    ],
  };
}

function ChartCard({
  title,
  description,
  option,
}: {
  title: string;
  description: string;
  option: ChartOption;
}) {
  return (
    <Card className="h-full border-border/70 bg-background/90">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <EChart option={option} />
      </CardContent>
    </Card>
  );
}

function MetricCard({ item }: { item: MetricItem }) {
  return (
    <Card className="border-border/70 bg-background/90">
      <CardHeader className="space-y-2 pb-3">
        <CardDescription>{item.label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {formatMetricValue(item.value, item.format)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  );
}

function ModuleSectionView({ module }: { module: ModuleSection }) {
  return (
    <section
      className="rounded-[28px] border border-border/70 bg-gradient-to-b from-background to-muted/10 p-5 shadow-sm md:p-6"
      id={module.key}
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="px-3 py-1"
            style={{ borderColor: module.accent, color: module.accent }}
          >
            {module.title}
          </Badge>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{module.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {module.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              {link.label} · {link.value}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {module.metrics.map((metric) => (
          <MetricCard key={metric.label} item={metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {module.charts.map((chart, index) => {
          const option =
            chart.kind === "line"
              ? buildLineOption(chart.payload)
              : chart.kind === "bar"
                ? buildBarOption(chart.payload)
                : buildPieOption(chart.payload);

          return (
            <ChartCard
              key={`${module.key}-${chart.kind}-${index}`}
              title={chart.payload.title}
              description={chart.payload.description}
              option={option}
            />
          );
        })}
      </div>
    </section>
  );
}

export function AdminCloudExhibitionDashboard({
  data,
}: {
  data: CloudExhibitionDashboardData;
}) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border-0 bg-gradient-to-br from-slate-950 via-cyan-900 to-amber-700 text-slate-50 shadow-xl">
        <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-white/20 bg-white/10 px-3 py-1 text-white"
            >
              模块化云展看板
            </Badge>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">{data.overview.title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-200/85">
                {data.overview.summary}
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-200/70">
              最近更新时间 {formatDateTime(data.overview.lastUpdatedAt)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.overview.highlights.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-slate-200/70">
                  {metric.label}
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {formatMetricValue(metric.value, metric.format)}
                </div>
                <div className="mt-2 text-xs text-slate-200/80">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.modules.map((module) => (
          <Link
            key={module.key}
            href={`#${module.key}`}
            className="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="text-xs uppercase tracking-[0.22em]" style={{ color: module.accent }}>
              Module
            </div>
            <div className="mt-2 text-lg font-semibold">{module.title}</div>
            <div className="mt-2 text-sm text-muted-foreground">{module.description}</div>
          </Link>
        ))}
      </section>

      <div className="space-y-6">
        {data.modules.map((module) => (
          <ModuleSectionView key={module.key} module={module} />
        ))}
      </div>
    </div>
  );
}
