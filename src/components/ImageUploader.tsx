"use client";
import { useRef, useState } from "react";
import { useToast } from "./ui";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX = 12 * 1024 * 1024; // 12MB source; we downscale before storing
const MAX_DIM = 1280; // longest edge after downscale
const QUALITY = 0.82;

// Read a file, downscale to a data URL entirely in the browser (no server).
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, w, h);
        // PNGs may carry transparency; keep PNG for those, else WebP.
        const type = file.type === "image/png" ? "image/png" : "image/webp";
        resolve(canvas.toDataURL(type, QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  value,
  onChange,
  label,
  compact,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function handle(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast("Only JPG, PNG, or WebP allowed", "err");
      return;
    }
    if (file.size > MAX) {
      toast("Max file size is 12MB", "err");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compress(file);
      onChange(dataUrl);
      toast("Image added");
    } catch (e: any) {
      toast(e.message || "Could not process image", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-3 ${compact ? "" : "flex-col sm:flex-row"}`}
      >
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 ${
            compact ? "h-12 w-12" : "h-20 w-20"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-white/30">none</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-light disabled:opacity-50"
          >
            {busy ? "Processing…" : value ? "Change" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/20"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
