"use client";

import * as React from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { LocateFixed } from "lucide-react";

type AMapSdk = any;

let amapPreviewPromise: Promise<AMapSdk> | null = null;

function loadPreviewSdk() {
  if (amapPreviewPromise) return amapPreviewPromise;

  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) {
    return Promise.reject(new Error("missing_amap_key"));
  }

  const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE;
  if (securityJsCode) {
    window._AMapSecurityConfig = {
      securityJsCode,
    };
  }

  amapPreviewPromise = AMapLoader.load({
    key,
    version: "2.0",
    plugins: ["AMap.Geocoder", "AMap.Scale"],
  });

  return amapPreviewPromise;
}

function extractLngLat(position: any) {
  if (!position) return null;

  const lng =
    typeof position.lng === "number"
      ? position.lng
      : typeof position.getLng === "function"
        ? position.getLng()
        : null;
  const lat =
    typeof position.lat === "number"
      ? position.lat
      : typeof position.getLat === "function"
        ? position.getLat()
        : null;

  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

function buildMapUrl(title?: string, address?: string) {
  const name = encodeURIComponent(title || "线下展览");
  const value = encodeURIComponent(address || "");
  return `https://uri.amap.com/search?keyword=${name}%20${value}&src=hangyi&coordinate=gaode&callnative=0`;
}

export function OfflineExhibitionMapPreview({
  title,
  address,
}: {
  title?: string;
  address?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);

  const [status, setStatus] = React.useState("地图加载中");

  React.useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const keyword = String([title, address].filter(Boolean).join(" ")).trim();
      if (!keyword) {
        setStatus("未提供可预览的位置");
        return;
      }

      try {
        const AMap = await loadPreviewSdk();
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new AMap.Map(containerRef.current, {
            zoom: 13,
            center: [120.15507, 30.274084],
            viewMode: "2D",
          });
          mapRef.current.addControl(new AMap.Scale());
        }

        const geocoder = new AMap.Geocoder();
        geocoder.getLocation(keyword, (statusText: string, result: any) => {
          if (cancelled) return;
          if (statusText !== "complete" || !result?.geocodes?.length) {
            setStatus("地址解析失败，请使用高德打开查看");
            return;
          }

          const geocode = result.geocodes[0];
          const point = extractLngLat(geocode.location);
          if (!point) {
            setStatus("坐标解析失败");
            return;
          }

          if (markerRef.current) {
            mapRef.current.remove(markerRef.current);
          }

          markerRef.current = new AMap.Marker({
            position: [point.lng, point.lat],
            title: title || "线下展览",
          });

          mapRef.current.add(markerRef.current);
          mapRef.current.setZoomAndCenter(15, [point.lng, point.lat]);
          setStatus(geocode.formattedAddress || "地图已定位");
        });
      } catch (error: any) {
        setStatus(
          error?.message === "missing_amap_key"
            ? "缺少 NEXT_PUBLIC_AMAP_KEY"
            : "地图加载失败"
        );
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [address, title]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[20px] border border-[#d7e1dd] bg-white dark:border-[#31443e] dark:bg-[#0e1513]">
        <div ref={containerRef} className="h-72 w-full" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f3f8f6] px-4 py-3 text-sm text-[#536862] dark:bg-[#18211f] dark:text-[#b7c8c2]">
        <div className="truncate">{status}</div>
        {(title || address) ? (
          <a
            href={buildMapUrl(title, address)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#d0dbd6] px-3 py-1.5 text-xs text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#22302c]"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            高德打开
          </a>
        ) : null}
      </div>
    </div>
  );
}
