"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell, { Card, Field, inputCls } from "@/components/AdminShell";
import ImageUploader from "@/components/ImageUploader";
import { ConfirmDialog, useToast, Spinner } from "@/components/ui";
import { api, getState } from "@/lib/client";
import type {
  GameBSettings,
  CognitiveTarget,
  CognitiveGameSession,
} from "@/lib/types";

function rid() {
  return "t-" + Math.random().toString(36).slice(2);
}

function GameBAdmin() {
  const toast = useToast();
  const [settings, setSettings] = useState<GameBSettings | null>(null);
  const [sessions, setSessions] = useState<CognitiveGameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  async function load() {
    const [s, h] = await Promise.all([
      getState(),
      api<{ sessions: CognitiveGameSession[] }>("/api/game-b/sessions"),
    ]);
    setSettings(s.gameB);
    setSessions(h.sessions);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!settings) return;
    if (settings.targets.length < 2) {
      toast("Need at least 2 targets", "err");
      return;
    }
    await api("/api/game-b/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    toast("Settings saved — live now");
  }

  function patchTarget(id: string, patch: Partial<CognitiveTarget>) {
    setSettings(
      (s) =>
        s && {
          ...s,
          targets: s.targets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }
    );
  }

  const stats = useMemo(() => {
    const passed = sessions.filter((s) => s.passed).length;
    const bests = sessions
      .map((s) => s.bestReactionMs)
      .filter((x): x is number => x != null);
    const avgs = sessions
      .map((s) => s.avgReactionMs)
      .filter((x): x is number => x != null);
    return {
      total: sessions.length,
      passed,
      bestOverall: bests.length ? Math.min(...bests) : null,
      avgOverall: avgs.length
        ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
        : null,
    };
  }, [sessions]);

  if (loading || !settings) return <Spinner label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Cognitive Test — Admin</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="Total Sessions" value={stats.total} />
        <StatBox label="Sharp Minds" value={stats.passed} />
        <StatBox
          label="Best Reaction"
          value={stats.bestOverall != null ? `${stats.bestOverall}ms` : "—"}
        />
        <StatBox
          label="Avg Reaction"
          value={stats.avgOverall != null ? `${stats.avgOverall}ms` : "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Branding & Copy">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader
              label="Background Image"
              value={settings.backgroundImage}
              onChange={(url) =>
                setSettings({ ...settings, backgroundImage: url })
              }
            />
            <ImageUploader
              label="Logo"
              value={settings.logo}
              onChange={(url) => setSettings({ ...settings, logo: url })}
            />
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <input
                className={inputCls}
                value={settings.subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, subtitle: e.target.value })
                }
              />
            </Field>
            <Field label="Description">
              <textarea
                className={inputCls}
                rows={2}
                value={settings.description}
                onChange={(e) =>
                  setSettings({ ...settings, description: e.target.value })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Success Message">
                <input
                  className={inputCls}
                  value={settings.successMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, successMessage: e.target.value })
                  }
                />
              </Field>
              <Field label="Fail Message">
                <input
                  className={inputCls}
                  value={settings.failMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, failMessage: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Gameplay">
          <div className="space-y-5">
            <Field label={`Game Duration: ${settings.durationSec}s`}>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={settings.durationSec}
                onChange={(e) =>
                  setSettings({ ...settings, durationSec: Number(e.target.value) })
                }
                className="w-full"
              />
            </Field>
            <Field label={`Sharp Mind Target Score: ${settings.sharpMindScore} hits`}>
              <input
                type="range"
                min={1}
                max={60}
                value={settings.sharpMindScore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sharpMindScore: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </Field>
            <Field
              label={`Animation / Hold Speed: ${
                settings.activeHoldMs === 0
                  ? "Wait for tap"
                  : settings.activeHoldMs + "ms auto-move"
              }`}
            >
              <input
                type="range"
                min={0}
                max={2000}
                step={100}
                value={settings.activeHoldMs}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    activeHoldMs: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <p className="mt-1 text-xs text-white/40">
                0 = target stays lit until tapped. Higher = target jumps away if
                not tapped in time (harder).
              </p>
            </Field>
          </div>
        </Card>
      </div>

      {/* Targets */}
      <Card
        title={`Reaction Targets (${settings.targets.length})`}
        right={
          <button
            onClick={() =>
              settings.targets.length < 8 &&
              setSettings({
                ...settings,
                targets: [
                  ...settings.targets,
                  { id: rid(), color: "#22c55e", image: null, label: "" },
                ],
              })
            }
            disabled={settings.targets.length >= 8}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20 disabled:opacity-40"
          >
            + Add Target
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settings.targets.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div
                className="h-14 w-14 shrink-0 rounded-full border-2 border-white/30"
                style={{ background: t.color }}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={t.color}
                    onChange={(e) => patchTarget(t.id, { color: e.target.value })}
                    className="h-8 w-10 rounded border border-white/10 bg-black/40"
                  />
                  <input
                    className={`${inputCls} py-1`}
                    placeholder="Label (optional)"
                    value={t.label}
                    onChange={(e) => patchTarget(t.id, { label: e.target.value })}
                  />
                </div>
                <ImageUploader
                  compact
                  value={t.image}
                  onChange={(url) => patchTarget(t.id, { image: url })}
                />
              </div>
              <button
                onClick={() =>
                  settings.targets.length > 2 &&
                  setSettings({
                    ...settings,
                    targets: settings.targets.filter((x) => x.id !== t.id),
                  })
                }
                disabled={settings.targets.length <= 2}
                className="text-red-400 hover:underline disabled:opacity-30"
                title={
                  settings.targets.length <= 2 ? "Minimum 2 targets" : "Remove"
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          4–6 targets recommended. Minimum 2, maximum 8.
        </p>
      </Card>

      <button
        onClick={save}
        className="rounded-lg bg-brand px-8 py-3 text-lg font-bold hover:bg-brand-light"
      >
        Save All Settings
      </button>

      {/* Session history */}
      <Card
        title={`Session History (${sessions.length})`}
        right={
          <button
            onClick={() => setConfirmReset(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-500"
          >
            Clear Sessions
          </button>
        }
      >
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/80 text-white/50">
              <tr>
                <th className="px-3 py-2">Session</th>
                <th className="px-3 py-2">Date / Time</th>
                <th className="px-3 py-2 text-right">Hits</th>
                <th className="px-3 py-2 text-right">Best</th>
                <th className="px-3 py-2 text-right">Avg</th>
                <th className="px-3 py-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    No sessions recorded yet.
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-3 py-2 font-mono text-xs text-white/50">
                    {s.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {s.totalHits}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {s.bestReactionMs != null ? `${s.bestReactionMs}ms` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {s.avgReactionMs != null ? `${s.avgReactionMs}ms` : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        s.passed ? "bg-emerald-600" : "bg-white/15"
                      }`}
                    >
                      {s.passed ? "SHARP" : "PRACTICE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Clear all sessions?"
        message="This permanently deletes every recorded cognitive-test session."
        danger
        confirmText="Delete all"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await api("/api/game-b/sessions", { method: "DELETE" });
          setConfirmReset(false);
          load();
          toast("Sessions cleared");
        }}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
      <div className="mt-1 text-3xl font-black tabular-nums text-gold">
        {value}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <GameBAdmin />
    </AdminShell>
  );
}
