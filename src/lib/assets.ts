// ---------- Default asset paths ----------
// Served from public/. Used as render-time fallbacks when no image is uploaded
// in admin (see game pages: `settings.xxx ?? DEFAULT_BG.yyy`). Drop replacement
// files at these exact paths to change the defaults — no code change needed.

export const DEFAULT_BG = {
  spinWheel: "/images/spin-wheel/background.png",
  spinWheelGift: "/images/spin-wheel/gift-background.png",
  cognitive: "/images/cognitive-test/background.png",
};

// ---------- Default per-gift images ----------
// Each wheel segment has a default image, resolved by its (0-based) order:
// segment order 0 -> gift-1.png, order 1 -> gift-2.png, and so on. Drop files
// at these paths to set a built-in image per gift; an image uploaded in admin
// (segment.image) overrides the default at render time. Missing files simply
// render nothing (the game page hides broken images).
export const GIFT_IMAGE_DIR = "/images/spin-wheel/gifts";

export function defaultGiftImage(order: number): string {
  return `${GIFT_IMAGE_DIR}/gift-${order + 1}.png`;
}
