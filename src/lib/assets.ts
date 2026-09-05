// ---------- Default asset paths ----------
// Served from public/. Used as render-time fallbacks when no image is uploaded
// in admin (see game pages: `settings.xxx ?? DEFAULT_BG.yyy`). Drop replacement
// files at these exact paths to change the defaults — no code change needed.

export const DEFAULT_BG = {
  spinWheel: "/images/spin-wheel/background.png",
  spinWheelGift: "/images/spin-wheel/gift-background.png",
  cognitive: "/images/cognitive-test/background.png",
};
