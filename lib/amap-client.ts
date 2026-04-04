import AMapLoader from "@amap/amap-jsapi-loader";

type AMapSdk = any;

let amapPromise: Promise<AMapSdk> | null = null;

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

export function loadAmapSdk() {
  if (amapPromise) return amapPromise;

  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) {
    return Promise.reject(new Error("missing_amap_key"));
  }

  const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE;
  if (securityJsCode) {
    (window as any)._AMapSecurityConfig = {
      securityJsCode,
    };
  }

  amapPromise = AMapLoader.load({
    key,
    version: "2.0",
    plugins: ["AMap.Geolocation"],
  });

  return amapPromise;
}

export async function getCurrentAmapAddress() {
  const AMap = await loadAmapSdk();

  return new Promise<{
    formattedAddress: string;
    lng?: number;
    lat?: number;
  }>((resolve, reject) => {
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      needAddress: true,
    });

    geolocation.getCurrentPosition((statusText: string, result: any) => {
      if (statusText !== "complete") {
        reject(
          new Error(
            result?.message || "定位失败，请确认已授权浏览器定位并开启高精度定位"
          )
        );
        return;
      }

      const point = extractLngLat(result?.position);
      resolve({
        formattedAddress: String(result?.formattedAddress || "").trim(),
        lng: point?.lng,
        lat: point?.lat,
      });
    });
  });
}
