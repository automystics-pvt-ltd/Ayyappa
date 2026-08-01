/**
 * Shared html2canvas capture configuration for in-kind contribution receipts.
 *
 * Imported by ContributionReceipt.tsx (production) and by the Playwright
 * pixel-validation test (inkind-receipt-tamil-glyphs.test.mjs) so that both
 * always use the identical capture logic.  Any change here is reflected in
 * both the production component and the test automatically.
 */

export const IKC_CAPTURE_SCALE      = 2;
export const IKC_CAPTURE_BACKGROUND = "#c2410c";

/**
 * Absolute URL of the self-hosted fonts stylesheet.
 *
 * Resolved once at module-evaluation time from Vite's BASE_URL so it works
 * regardless of where the app is mounted (root "/" or a sub-path).  The file
 * lives at public/fonts/fonts.css and is always served from the same origin,
 * so it reaches the browser even when Google Fonts is blocked.
 */
const FONTS_CSS_URL = new URL(
  `${import.meta.env.BASE_URL}fonts/fonts.css`,
  window.location.origin
).href;

/**
 * html2canvas onclone callback for IKC receipts.
 *
 * Injects the self-hosted fonts.css into the cloned document and waits until
 * all fonts (Noto Serif Tamil, Cinzel, Inter) are ready before html2canvas
 * rasterises the DOM.  Without this guard Tamil text renders as tofu squares
 * (□) in the downloaded WhatsApp image.
 *
 * Using a same-origin stylesheet means the font load always succeeds — even
 * when Google Fonts is blocked by an ad blocker, corporate proxy, or when
 * the user is offline.
 *
 * Also sets overflow:visible on the seal and its parent so the
 * transform:rotate(-6deg) on .ikc-seal does not clip the rotated corners.
 */
export async function ikcCaptureOnClone(_clonedDoc: Document, el: HTMLElement): Promise<void> {
  const clonedDoc = el.ownerDocument;

  // Inject the self-hosted fonts stylesheet into the cloned document.
  // It is served from the same origin so it is always reachable, unlike the
  // Google Fonts CDN which can be blocked by ad blockers or corporate proxies.
  const link = clonedDoc.createElement("link");
  link.rel  = "stylesheet";
  link.href = FONTS_CSS_URL;
  clonedDoc.head.appendChild(link);
  await new Promise<void>((resolve) => {
    link.addEventListener("load",  () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
    setTimeout(resolve, 3000); // local file should be fast; guard against edge cases
  });

  // Wait for the font-faces declared in the injected stylesheet to be fully
  // parsed and their binary data available to the layout engine.
  await clonedDoc.fonts.ready;

  // Fix seal clip: transform:rotate(-6deg) causes the SVG to extend beyond
  // its bounding box.  overflow:visible on both elements prevents cropping.
  const seal = el.querySelector<SVGElement>(".ikc-seal");
  if (seal) seal.style.overflow = "visible";
  const ack = el.querySelector<HTMLElement>(".ikc-ack");
  if (ack) ack.style.overflow = "visible";
}
