"use client";
import { useRef, useState } from "react";
import { useToast } from "./ui";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX = 6 * 1024 * 1024;

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
      toast("Max file size is 6MB", "err");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast("Image uploaded");
    } catch (e: any) {
      toast(e.message || "Upload failed", "err");
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
            {busy ? "Uploading…" : value ? "Change" : "Upload"}
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
