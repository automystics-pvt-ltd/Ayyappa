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
 * html2canvas onclone callback for IKC receipts.
 *
 * Injects Google Fonts into the cloned document and waits until they are
 * ready before html2canvas rasterises the DOM.  Without this guard Tamil
 * text renders as tofu squares (□) in the downloaded WhatsApp image.
 *
 * Also sets overflow:visible on the seal and its parent so the
 * transform:rotate(-6deg) on .ikc-seal does not clip the rotated corners.
 */
export async function ikcCaptureOnClone(_clonedDoc: Document, el: HTMLElement): Promise<void> {
  const link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900" +
    "&family=Noto+Serif+Tamil:wght@400;600;700;800" +
    "&family=Inter:wght@400;500;600;700;800;900" +
    "&family=Oswald:wght@600;700&display=swap";
  el.ownerDocument.head.appendChild(link);
  // Wait for the stylesheet to load, then wait for all fonts to be parsed.
  // Without this the cloned document may still be using system fallbacks
  // (rendering Tamil as tofu squares) when html2canvas starts drawing.
  await new Promise<void>((resolve) => {
    link.addEventListener("load",  () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
    setTimeout(resolve, 4000); // never block indefinitely
  });
  await el.ownerDocument.fonts.ready;
  // Fix seal clip: transform:rotate(-6deg) causes the SVG to extend beyond
  // its bounding box.  overflow:visible on both elements prevents cropping.
  const seal = el.querySelector<SVGElement>(".ikc-seal");
  if (seal) seal.style.overflow = "visible";
  const ack = el.querySelector<HTMLElement>(".ikc-ack");
  if (ack) ack.style.overflow = "visible";
}
