"use client";

import * as React from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed, MapPinned, Navigation, Search } from "lucide-react";

type LocationPatch = {
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  address_detail?: string;
  formatted_address?: string;
};

type AMapSdk = any;
type SearchCandidate = {
  id: string;
  name: string;
  address: string;
  lng?: number;
  lat?: number;
};

let amapPromise: Promise<AMapSdk> | null = null;

function loadAmapSdk() {
  if (amapPromise) return amapPromise;

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

  amapPromise = AMapLoader.load({
    key,
    version: "2.0",
    plugins: [
      "AMap.Geocoder",
      "AMap.Geolocation",
      "AMap.Scale",
      "AMap.ToolBar",
      "AMap.PlaceSearch",
    ],
  });

  return amapPromise;
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

  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }

  return { lng, lat };
}

function cityToString(city: unknown) {
  if (Array.isArray(city)) {
    return String(city[0] || "").trim();
  }

  return String(city || "").trim();
}

function patchFromAddress(addressComponent: any, formattedAddress?: string): LocationPatch {
  const street = String(
    addressComponent?.street || addressComponent?.township || ""
  ).trim();
  const number = String(addressComponent?.streetNumber?.number || "").trim();

  return {
    province: String(addressComponent?.province || "").trim(),
    city: cityToString(addressComponent?.city),
    district: String(addressComponent?.district || "").trim(),
    street,
    address_detail: [street, number].filter(Boolean).join(" "),
    formatted_address: String(formattedAddress || "").trim(),
  };
}

function candidateFromPoi(poi: any, index: number): SearchCandidate {
  const point = extractLngLat(poi?.location);
  return {
    id: String(poi?.id || poi?.uid || `${poi?.name || "poi"}-${index}`),
    name: String(poi?.name || "").trim() || `候选地点 ${index + 1}`,
    address: String(poi?.address || poi?.pname || "").trim(),
    lng: point?.lng,
    lat: point?.lat,
  };
}

export function OfflineExhibitionMapPanel({
  title,
  venueName,
  locationText,
  addressDetail,
  onResolve,
}: {
  title?: string;
  venueName?: string;
  locationText?: string;
  addressDetail?: string;
  onResolve?: (patch: LocationPatch) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const sdkRef = React.useRef<AMapSdk | null>(null);
  const reverseGeocodeRef = React.useRef<
    ((lng: number, lat: number, label: string) => Promise<void>) | null
  >(null);

  const [status, setStatus] = React.useState("等待加载地图");
  const [loadingMap, setLoadingMap] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [resolvedAddress, setResolvedAddress] = React.useState("");
  const [resolvedCoords, setResolvedCoords] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [candidates, setCandidates] = React.useState<SearchCandidate[]>([]);

  const initMap = React.useCallback(async () => {
    if (mapRef.current || !containerRef.current) return sdkRef.current;

    const AMap = await loadAmapSdk();
    sdkRef.current = AMap;
    mapRef.current = new AMap.Map(containerRef.current, {
      zoom: 12,
      center: [120.15507, 30.274084],
      viewMode: "2D",
    });
    mapRef.current.addControl(new AMap.Scale());
    mapRef.current.addControl(new AMap.ToolBar({ position: "RB" }));
    mapRef.current.on("click", (event: any) => {
      const point = extractLngLat(event?.lnglat);
      if (!point || !reverseGeocodeRef.current) return;
      void reverseGeocodeRef.current(
        point.lng,
        point.lat,
        venueName || title || "线下展览位置"
      );
    });
    return AMap;
  }, [title, venueName]);

  const updateMarker = React.useCallback(
    async (lng: number, lat: number, label: string) => {
      const AMap = sdkRef.current || (await initMap());
      const map = mapRef.current;
      if (!AMap || !map) return;

      if (markerRef.current) {
        map.remove(markerRef.current);
      }

      const marker = new AMap.Marker({
        position: [lng, lat],
        title: label || "线下展览位置",
      });

      markerRef.current = marker;
      map.add(marker);
      map.setZoomAndCenter(15, [lng, lat]);
    },
    [initMap]
  );

  const previewByAddress = React.useCallback(async () => {
    const keyword = [venueName, locationText || addressDetail]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" ");

    if (!keyword) {
      setStatus("请先填写地图位置或详细地址");
      return;
    }

    setLoadingMap(true);
    try {
      const AMap = await initMap();
      const geocoder = new AMap.Geocoder();

      geocoder.getLocation(keyword, async (statusText: string, result: any) => {
        if (statusText !== "complete" || !result?.geocodes?.length) {
          setStatus("未找到匹配位置，请调整地图位置文本");
          setLoadingMap(false);
          return;
        }

        const geocode = result.geocodes[0];
        const point = extractLngLat(geocode.location);
        if (!point) {
          setStatus("地图坐标解析失败");
          setLoadingMap(false);
          return;
        }

        await updateMarker(point.lng, point.lat, venueName || title || keyword);
        setResolvedAddress(String(geocode.formattedAddress || keyword));
        setResolvedCoords(`${point.lng.toFixed(6)}, ${point.lat.toFixed(6)}`);
        setStatus("地图预览已更新");
        onResolve?.(
          patchFromAddress(geocode.addressComponent, geocode.formattedAddress || keyword)
        );
        setLoadingMap(false);
      });
    } catch (error: any) {
      setStatus(
        error?.message === "missing_amap_key"
          ? "缺少 NEXT_PUBLIC_AMAP_KEY"
          : "地图加载失败"
      );
      setLoadingMap(false);
    }
  }, [addressDetail, initMap, locationText, onResolve, title, updateMarker, venueName]);

  const reverseGeocode = React.useCallback(
    async (lng: number, lat: number, label: string) => {
      const AMap = await initMap();
      const geocoder = new AMap.Geocoder();

      geocoder.getAddress([lng, lat], async (statusText: string, result: any) => {
        if (statusText !== "complete" || !result?.regeocode) {
          setStatus("反查地址失败");
          return;
        }

        const regeocode = result.regeocode;
        const formattedAddress = String(regeocode?.formattedAddress || label).trim();

        await updateMarker(lng, lat, label);
        setResolvedAddress(formattedAddress);
        setResolvedCoords(`${lng.toFixed(6)}, ${lat.toFixed(6)}`);
        setStatus("地图点选位置已回填");
        onResolve?.(patchFromAddress(regeocode.addressComponent, formattedAddress));
      });
    },
    [initMap, onResolve, updateMarker]
  );

  const searchCandidates = React.useCallback(async () => {
    const keyword = String(searchKeyword || locationText || addressDetail || "").trim();
    if (!keyword) {
      setStatus("请输入要搜索的位置关键词");
      return;
    }

    setSearching(true);
    try {
      const AMap = await initMap();
      const placeSearch = new AMap.PlaceSearch({
        pageSize: 6,
        extensions: "all",
      });

      placeSearch.search(keyword, (statusText: string, result: any) => {
        if (statusText !== "complete") {
          setCandidates([]);
          setStatus("候选地点搜索失败");
          setSearching(false);
          return;
        }

        const pois = Array.isArray(result?.poiList?.pois) ? result.poiList.pois : [];
        const next = pois.map(candidateFromPoi).filter((item: SearchCandidate) => item.name);
        setCandidates(next);
        setStatus(next.length > 0 ? "已生成候选地点" : "未找到候选地点");
        setSearching(false);
      });
    } catch (error: any) {
      setStatus(
        error?.message === "missing_amap_key"
          ? "缺少 NEXT_PUBLIC_AMAP_KEY"
          : "地点搜索失败"
      );
      setSearching(false);
    }
  }, [addressDetail, initMap, locationText, searchKeyword]);

  const chooseCandidate = React.useCallback(
    async (candidate: SearchCandidate) => {
      setSearchKeyword(candidate.name);
      if (typeof candidate.lng === "number" && typeof candidate.lat === "number") {
        await reverseGeocode(
          candidate.lng,
          candidate.lat,
          candidate.name || venueName || title || "线下展览位置"
        );
      } else {
        setStatus("候选地点缺少坐标，请尝试其他结果");
      }
    },
    [reverseGeocode, title, venueName]
  );

  React.useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode;
  }, [reverseGeocode]);

  const locateMe = React.useCallback(async () => {
    setLocating(true);
    try {
      const AMap = await initMap();
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        needAddress: true,
      });

      geolocation.getCurrentPosition(async (statusText: string, result: any) => {
        if (statusText !== "complete") {
          setStatus(result?.message || "定位失败，请确认已授权浏览器定位");
          setLocating(false);
          return;
        }

        const point = extractLngLat(result?.position);
        const formattedAddress = String(result?.formattedAddress || "").trim();
        const addressComponent = result?.addressComponent;

        if (point) {
          await updateMarker(point.lng, point.lat, "当前位置");
          setResolvedCoords(`${point.lng.toFixed(6)}, ${point.lat.toFixed(6)}`);
        }

        setResolvedAddress(formattedAddress || "已获取当前位置");
        setStatus("当前位置已获取并回填");
        onResolve?.(patchFromAddress(addressComponent, formattedAddress));
        setLocating(false);
      });
    } catch (error: any) {
      setStatus(
        error?.message === "missing_amap_key"
          ? "缺少 NEXT_PUBLIC_AMAP_KEY"
          : "地图加载失败"
      );
      setLocating(false);
    }
  }, [initMap, onResolve, updateMarker]);

  React.useEffect(() => {
    void initMap().catch((error: any) => {
      setStatus(
        error?.message === "missing_amap_key"
          ? "缺少 NEXT_PUBLIC_AMAP_KEY"
          : "地图初始化失败"
      );
    });
  }, [initMap]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-[#d7e1dd] bg-white dark:border-[#31443e] dark:bg-[#0e1513]">
        <div ref={containerRef} className="h-60 w-full" />
      </div>

      <div className="rounded-[20px] border border-[#d7e1dd] bg-white p-4 dark:border-[#31443e] dark:bg-[#0e1513]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#73837d] dark:text-[#91a49d]" />
          <Input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="搜索候选地点，例如：杭州国际工艺周"
            className="h-11 rounded-[14px] border-[#d5e0dc] pl-9 dark:border-[#31443e] dark:bg-[#0e1513] dark:text-[#edf5f2]"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={searching} onClick={() => void searchCandidates()}>
            <Search className="h-4 w-4" />
            {searching ? "搜索中..." : "搜索候选地点"}
          </Button>
          <div className="text-xs leading-6 text-[#72827c] dark:text-[#91a49d]">
            也可以直接点击下方地图任意位置，系统会自动反查地址并回填表单。
          </div>
        </div>

        {candidates.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => void chooseCandidate(candidate)}
                className="rounded-[14px] border border-[#d7e1dd] bg-[#f7faf9] px-4 py-3 text-left transition hover:border-[#9db7b0] hover:bg-[#eef6f2] dark:border-[#31443e] dark:bg-[#18211f] dark:hover:bg-[#22302c]"
              >
                <div className="text-sm font-medium text-[#213632] dark:text-[#e5efeb]">
                  {candidate.name}
                </div>
                <div className="mt-1 text-xs text-[#72827c] dark:text-[#91a49d]">
                  {candidate.address || "无详细地址"}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={loadingMap} onClick={() => void previewByAddress()}>
          <MapPinned className="h-4 w-4" />
          {loadingMap ? "预览中..." : "按地址预览"}
        </Button>
        <Button type="button" disabled={locating} onClick={() => void locateMe()}>
          <LocateFixed className="h-4 w-4" />
          {locating ? "定位中..." : "获取当前位置"}
        </Button>
        {(locationText || addressDetail) ? (
          <a
            href={`https://uri.amap.com/search?keyword=${encodeURIComponent(
              [venueName, locationText || addressDetail].filter(Boolean).join(" ")
            )}&src=hangyi&coordinate=gaode&callnative=0`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0dbd6] px-4 text-sm font-medium text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#18211f]"
          >
            <Navigation className="h-4 w-4" />
            高德打开
          </a>
        ) : null}
      </div>

      <div className="rounded-[20px] bg-[#f3f8f6] p-4 text-sm leading-7 text-[#536862] dark:bg-[#18211f] dark:text-[#b7c8c2]">
        <div>状态：{status}</div>
        <div>解析地址：{resolvedAddress || "未解析"}</div>
        <div>临时坐标：{resolvedCoords || "未生成"}</div>
      </div>
    </div>
  );
}
