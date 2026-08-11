/**
 * TikTok Pixel — carregado em todas as páginas da oferta.
 * O snippet abaixo é o oficial da TikTok, injetado inline no <head>.
 */
export const TIKTOK_PIXEL_ID = "D4N12F3C77UCJ0N6NBQ0";

export const TIKTOK_PIXEL_SNIPPET = `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');
`;

/** Dispara um evento no pixel de forma segura (no-op no servidor). */
export function ttqTrack(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  const ttq = (window as any).ttq;
  if (!ttq?.track) return;
  try {
    if (eventId) {
      ttq.track(event, params ?? {}, { event_id: eventId });
    } else {
      ttq.track(event, params ?? {});
    }
  } catch (err) {
    console.error("TikTok pixel track failed", err);
  }
}

/** Registra um pageview (usar em mudanças de rota client-side). */
export function ttqPage() {
  if (typeof window === "undefined") return;
  const ttq = (window as any).ttq;
  if (!ttq?.page) return;
  try {
    ttq.page();
  } catch (err) {
    console.error("TikTok pixel page failed", err);
  }
}
