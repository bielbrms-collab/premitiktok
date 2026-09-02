const ATTRIBUTION_KEYS = ["ttclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const STORAGE_PREFIX = "tiktok_attribution_";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function captureTikTokAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  }
  const ttp = readCookie("_ttp") ?? params.get("ttp");
  if (ttp) window.localStorage.setItem(`${STORAGE_PREFIX}ttp`, ttp);
}

export function buildTrackedCheckoutUrl(checkoutUrl: string) {
  if (typeof window === "undefined") return checkoutUrl;
  captureTikTokAttribution();
  const current = new URLSearchParams(window.location.search);
  const target = new URL(checkoutUrl);
  for (const key of ATTRIBUTION_KEYS) {
    const value = current.get(key) ?? window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (value) target.searchParams.set(key, value);
  }
  const ttp = readCookie("_ttp") ?? window.localStorage.getItem(`${STORAGE_PREFIX}ttp`);
  if (ttp) target.searchParams.set("ttp", ttp);
  return target.toString();
}