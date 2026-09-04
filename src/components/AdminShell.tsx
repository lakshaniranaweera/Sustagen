"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadState, verifyPassword } from "@/lib/store";
import { GAMES } from "@/lib/games";
import { ToastProvider, useToast, Spinner } from "./ui";

const SESSION_KEY = "admin-authed";

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#1a1030,#05050a_70%)] p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const state = await loadState();
            const ok = await verifyPassword(state, password);
            if (!ok) throw new Error("Incorrect password");
            try {
              sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              /* ignore */
            }
            onLogin();
          } catch (e: any) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        }}
        className="glass w-full max-w-sm rounded-2xl p-8"
      >
        <h1 className="text-2xl font-black uppercase text-white">Admin Login</h1>
        <p className="mt-1 text-sm text-white/50">
          Default password: <code className="text-gold">admin123</code>
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-6 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-brand-light"
          autoFocus
        />
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <button
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-brand py-3 font-bold text-white hover:bg-brand-light disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
        <Link
          href="/"
          className="mt-4 block text-center text-sm text-white/40 hover:text-white"
        >
          ← Back to site
        </Link>
      </form>
    </div>
  );
}

function Nav({ onLogout }: { onLogout: () => void }) {
  const path = usePathname();
  const toast = useToast();
  const links = [
    { href: "/admin", label: "Overview" },
    ...GAMES.map((g) => ({ href: g.adminPath, label: g.name })),
    { href: "/admin/reports", label: "Reports" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-4">
        <span className="mr-4 text-lg font-black uppercase text-white">
          ⚙ Admin
        </span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              path === l.href
                ? "bg-brand text-white"
                : "text-white/60 hover:bg-white/10"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10"
          >
            View Site ↗
          </Link>
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(SESSION_KEY);
              } catch {
                /* ignore */
              }
              toast("Logged out");
              onLogout();
            }}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      setAuthed(false);
    }
  }, []);
  if (authed === null)
    return (
      <div className="min-h-screen bg-black">
        <Spinner label="Checking session…" />
      </div>
    );
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
  return (
    <div className="min-h-screen bg-[#08080d] text-white">
      <Nav onLogout={() => setAuthed(false)} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Gate>{children}</Gate>
    </ToastProvider>
  );
}

// Small shared UI atoms for admin forms
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-brand-light";
