"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Card, Field, inputCls } from "@/components/AdminShell";
import ImageUploader from "@/components/ImageUploader";
import { useToast, Spinner } from "@/components/ui";
import { loadState, mutateState, hashPassword } from "@/lib/store";
import { GAMES } from "@/lib/games";
import type { LandingSettings } from "@/lib/types";

function Overview() {
  const toast = useToast();
  const [landing, setLanding] = useState<LandingSettings | null>(null);
  const [stats, setStats] = useState<{ spins: number; sessions: number }>({
    spins: 0,
    sessions: 0,
  });
  const [pw, setPw] = useState("");

  async function load() {
    const s = await loadState();
    setLanding(s.landing);
    setStats({ spins: s.spins.length, sessions: s.sessions.length });
  }
  useEffect(() => {
    load();
  }, []);

  async function saveLanding() {
    if (!landing) return;
    await mutateState((d) => {
      d.landing = landing;
    });
    toast("Landing page saved");
  }

  if (!landing) return <Spinner label="Loading…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Campaign Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="Total Spins" value={stats.spins} />
        <StatBox label="Test Sessions" value={stats.sessions} />
        {GAMES.map((g) => (
          <Link key={g.id} href={g.adminPath}>
            <div
              className={`flex h-full items-center justify-center rounded-2xl bg-gradient-to-br ${g.gradient} p-6 text-center font-black uppercase hover:opacity-90`}
            >
              {g.emoji} Manage {g.name} →
            </div>
          </Link>
        ))}
      </div>

      <Card title="Landing Page">
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUploader
            label="Background Image"
            value={landing.backgroundImage}
            onChange={(url) =>
              setLanding((l) => l && { ...l, backgroundImage: url })
            }
          />
          <div className="space-y-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={landing.title}
                onChange={(e) =>
                  setLanding((l) => l && { ...l, title: e.target.value })
                }
              />
            </Field>
            <Field label="Subtitle">
              <input
                className={inputCls}
                value={landing.subtitle}
                onChange={(e) =>
                  setLanding((l) => l && { ...l, subtitle: e.target.value })
                }
              />
            </Field>
          </div>
        </div>
        <button
          onClick={saveLanding}
          className="mt-5 rounded-lg bg-brand px-6 py-2.5 font-bold hover:bg-brand-light"
        >
          Save Landing Page
        </button>
      </Card>

      <Card title="Security">
        <Field label="Change Admin Password">
          <div className="flex gap-3">
            <input
              type="password"
              className={inputCls}
              placeholder="New password (min 4 chars)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              onClick={async () => {
                if (pw.length < 4) {
                  toast("Password must be at least 4 characters", "err");
                  return;
                }
                const hash = await hashPassword(pw);
                await mutateState((d) => {
                  d.adminPasswordHash = hash;
                });
                setPw("");
                toast("Password updated");
              }}
              className="shrink-0 rounded-lg bg-brand px-6 py-2.5 font-bold hover:bg-brand-light"
            >
              Update
            </button>
          </div>
        </Field>
      </Card>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black tabular-nums text-gold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Overview />
    </AdminShell>
  );
}
