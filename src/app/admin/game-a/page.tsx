"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell, { Card, Field, inputCls } from "@/components/AdminShell";
import ImageUploader from "@/components/ImageUploader";
import Wheel from "@/components/Wheel";
import { ConfirmDialog, useToast, Spinner } from "@/components/ui";
import { loadState, mutateState, newId } from "@/lib/store";
import { useRequireGame } from "@/lib/games";
import { todayKey } from "@/lib/report";
import type { GameASettings, WheelSegment, WheelSpin } from "@/lib/types";

function newSegment(order: number): WheelSegment {
  return {
    id: newId(),
    name: "New Prize",
    image: null,
    color: "#7c3aed",
    totalWinners: 10,
    remainingWinners: 10,
    odds: 10,
    active: true,
    order,
  };
}

function GameAAdmin() {
  const toast = useToast();
  const gameReady = useRequireGame("game-a", "/admin");
  const [settings, setSettings] = useState<GameASettings | null>(null);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [spins, setSpins] = useState<WheelSpin[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    action: string;
  }>(null);

  async function load() {
    const s = await loadState();
    setSettings(s.gameA);
    setSegments([...s.segments].sort((a, b) => a.order - b.order));
    setSpins([...s.spins].reverse());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    await mutateState((d) => {
      d.gameA = settings;
    });
    toast("Settings saved — live now");
  }

  async function saveSegments() {
    const ordered = segments.map((s, i) => ({ ...s, order: i }));
    await mutateState((d) => {
      d.segments = ordered;
    });
    setSegments(ordered);
    toast("Segments saved — live now");
  }

  function patchSeg(id: string, patch: Partial<WheelSegment>) {
    setSegments((segs) =>
      segs.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }
  function move(idx: number, dir: -1 | 1) {
    setSegments((segs) => {
      const arr = [...segs];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return segs;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  }

  async function runControl(action: string) {
    await mutateState((d) => {
      switch (action) {
        case "start":
          d.gameA.status = "running";
          break;
        case "pause":
          d.gameA.status = "paused";
          break;
        case "reset-winners":
          d.segments.forEach((s) => {
            s.remainingWinners = s.totalWinners;
            s.active = true;
          });
          break;
        case "reset-spins":
          d.spins = [];
          break;
        case "start-new-day":
          // Keep the spin log (for reports); restore each gift's daily allocation.
          d.segments.forEach((s) => {
            s.remainingWinners = s.totalWinners;
            s.active = true;
          });
          d.gameA.lastRolloverDay = todayKey(d.gameA.dayStartHour);
          break;
        case "reset-all":
          d.spins = [];
          d.segments.forEach((s) => {
            s.remainingWinners = s.totalWinners;
            s.active = true;
          });
          d.gameA.status = "running";
          break;
      }
    });
    await load();
    toast("Done");
  }

  const stats = useMemo(() => {
    const totalWinners = segments.reduce((a, s) => a + s.totalWinners, 0);
    const remaining = segments.reduce((a, s) => a + s.remainingWinners, 0);
    const soldOut = segments.filter(
      (s) => s.remainingWinners <= 0 || !s.active
    ).length;
    return { totalWinners, remaining, soldOut, awarded: totalWinners - remaining };
  }, [segments]);

  if (loading || !settings || !gameReady)
    return <Spinner label="Loading dashboard…" />;

  const mode = settings.oddsMode;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Spin the Wheel — Admin</h1>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${
            settings.status === "running" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {settings.status.toUpperCase()}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatBox label="Total Spins" value={spins.length} />
        <StatBox label="Prizes Awarded" value={stats.awarded} />
        <StatBox label="Remaining Prizes" value={stats.remaining} />
        <StatBox label="Sold Out" value={stats.soldOut} />
        <StatBox label="Segments" value={segments.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live preview */}
        <Card title="Live Wheel Preview">
          <div className="mx-auto max-w-md">
            <Wheel
              segments={[...segments].sort((a, b) => a.order - b.order)}
              rotation={0}
              duration={0}
              centerImage={settings.centerImage}
              spinning={false}
              style={{
                ringColorOuter: settings.ringColorOuter,
                ringColorInner: settings.ringColorInner,
                pointerColor: settings.pointerColor,
                hubBorderColor: settings.hubBorderColor,
                centerText: settings.centerText,
                centerTextColor: settings.centerTextColor,
              }}
            />
          </div>
        </Card>

        {/* Appearance / behaviour */}
        <Card title="Appearance & Behaviour">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader
              label="Main Background"
              value={settings.backgroundImage}
              onChange={(url) => setSettings({ ...settings, backgroundImage: url })}
            />
            <ImageUploader
              label="Center Logo (overrides text)"
              value={settings.centerImage}
              onChange={(url) => setSettings({ ...settings, centerImage: url })}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <Field label="Center Text (when no logo)">
              <input
                className={inputCls}
                value={settings.centerText}
                onChange={(e) =>
                  setSettings({ ...settings, centerText: e.target.value })
                }
              />
            </Field>
            <Field label="Center Text Colour">
              <input
                type="color"
                className="h-10 w-16 rounded border border-white/10 bg-black/40"
                value={settings.centerTextColor}
                onChange={(e) =>
                  setSettings({ ...settings, centerTextColor: e.target.value })
                }
              />
            </Field>
            <Field label="Button Text">
              <input
                className={inputCls}
                value={settings.buttonText}
                onChange={(e) =>
                  setSettings({ ...settings, buttonText: e.target.value })
                }
              />
            </Field>
            <Field label={`Spin Duration (${settings.spinDurationSec}s)`}>
              <input
                type="range"
                min={1}
                max={12}
                value={settings.spinDurationSec}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    spinDurationSec: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </Field>
            <Field label={`Rotations (${settings.rotations})`}>
              <input
                type="range"
                min={2}
                max={12}
                value={settings.rotations}
                onChange={(e) =>
                  setSettings({ ...settings, rotations: Number(e.target.value) })
                }
                className="w-full"
              />
            </Field>
            <Field label="Popup Title">
              <input
                className={inputCls}
                value={settings.popupTitle}
                onChange={(e) =>
                  setSettings({ ...settings, popupTitle: e.target.value })
                }
              />
            </Field>
            <Field label="Popup Subtitle">
              <input
                className={inputCls}
                value={settings.popupSubtitle}
                onChange={(e) =>
                  setSettings({ ...settings, popupSubtitle: e.target.value })
                }
              />
            </Field>
          </div>
          <button
            onClick={saveSettings}
            className="mt-5 rounded-lg bg-brand px-6 py-2.5 font-bold hover:bg-brand-light"
          >
            Save Settings
          </button>
        </Card>
      </div>

      {/* Wheel layout & colours */}
      <Card title="Wheel Layout & Colours">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={`Wheel Size (${settings.wheelSize}px)`}>
            <input
              type="range"
              min={400}
              max={1100}
              step={10}
              value={settings.wheelSize}
              onChange={(e) =>
                setSettings({ ...settings, wheelSize: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>
          <Field label={`Horizontal Offset (${settings.wheelOffsetX}px)`}>
            <input
              type="range"
              min={-300}
              max={300}
              value={settings.wheelOffsetX}
              onChange={(e) =>
                setSettings({ ...settings, wheelOffsetX: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>
          <Field label={`Vertical Offset (${settings.wheelOffsetY}px)`}>
            <input
              type="range"
              min={-300}
              max={300}
              value={settings.wheelOffsetY}
              onChange={(e) =>
                setSettings({ ...settings, wheelOffsetY: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>
          <ColorField
            label="Ring Outer"
            value={settings.ringColorOuter}
            onChange={(v) => setSettings({ ...settings, ringColorOuter: v })}
          />
          <ColorField
            label="Ring Inner"
            value={settings.ringColorInner}
            onChange={(v) => setSettings({ ...settings, ringColorInner: v })}
          />
          <ColorField
            label="Pointer"
            value={settings.pointerColor}
            onChange={(v) => setSettings({ ...settings, pointerColor: v })}
          />
          <ColorField
            label="Hub Border"
            value={settings.hubBorderColor}
            onChange={(v) => setSettings({ ...settings, hubBorderColor: v })}
          />
        </div>
        <button
          onClick={saveSettings}
          className="mt-5 rounded-lg bg-brand px-6 py-2.5 font-bold hover:bg-brand-light"
        >
          Save Layout
        </button>
      </Card>

      {/* Odds mode & daily rollover */}
      <Card title="Winner Selection & Daily Reset">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Field label="Selection Mode">
              <div className="flex gap-2">
                <ModeButton
                  active={mode === "count"}
                  onClick={() => setSettings({ ...settings, oddsMode: "count" })}
                  title="Daily Count"
                  desc="Each gift has a daily quantity; winners are random across remaining stock until all finish."
                />
                <ModeButton
                  active={mode === "odds"}
                  onClick={() => setSettings({ ...settings, oddsMode: "odds" })}
                  title="Fixed Odds"
                  desc="Each gift has a fixed probability weight; counts never run out."
                />
              </div>
            </Field>
          </div>
          <div className="space-y-4">
            <Field label={`Day Starts At (${settings.dayStartHour}:00)`}>
              <input
                type="range"
                min={0}
                max={23}
                value={settings.dayStartHour}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dayStartHour: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <p className="mt-1 text-xs text-white/40">
                Business-day boundary for end-of-day counts (e.g. 6 = day runs
                6am→6am).
              </p>
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.autoRollover}
                onChange={(e) =>
                  setSettings({ ...settings, autoRollover: e.target.checked })
                }
              />
              Auto-reset remaining counts at the start of each new day
            </label>
          </div>
        </div>
        <button
          onClick={saveSettings}
          className="mt-5 rounded-lg bg-brand px-6 py-2.5 font-bold hover:bg-brand-light"
        >
          Save Selection Settings
        </button>
      </Card>

      {/* Segment editor */}
      <Card
        title="Wheel Segments"
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setSegments((s) => [...s, newSegment(s.length)])}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
            >
              + Add Segment
            </button>
            <button
              onClick={saveSegments}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold hover:bg-brand-light"
            >
              Save Segments
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {segments.length === 0 && (
            <p className="py-8 text-center text-white/40">
              No segments yet. Add one to build the wheel.
            </p>
          )}
          {segments.map((s, i) => {
            const soldOut = s.remainingWinners <= 0 || !s.active;
            return (
              <div
                key={s.id}
                className="grid grid-cols-1 items-end gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:grid-cols-[auto_1fr_1fr_auto_auto_auto_auto_auto]"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    className="rounded bg-white/10 px-2 text-sm hover:bg-white/20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="rounded bg-white/10 px-2 text-sm hover:bg-white/20"
                  >
                    ▼
                  </button>
                </div>
                <Field label="Name">
                  <input
                    className={inputCls}
                    value={s.name}
                    onChange={(e) => patchSeg(s.id, { name: e.target.value })}
                  />
                </Field>
                <ImageUploader
                  label="Image"
                  compact
                  value={s.image}
                  onChange={(url) => patchSeg(s.id, { image: url })}
                />
                <Field label="Color">
                  <input
                    type="color"
                    className="h-10 w-16 rounded border border-white/10 bg-black/40"
                    value={s.color}
                    onChange={(e) => patchSeg(s.id, { color: e.target.value })}
                  />
                </Field>
                {mode === "count" ? (
                  <>
                    <Field label="Total">
                      <input
                        type="number"
                        min={0}
                        className={`${inputCls} w-20`}
                        value={s.totalWinners}
                        onChange={(e) =>
                          patchSeg(s.id, {
                            totalWinners: Math.max(0, Number(e.target.value)),
                          })
                        }
                      />
                    </Field>
                    <Field label="Remaining">
                      <input
                        type="number"
                        min={0}
                        className={`${inputCls} w-20`}
                        value={s.remainingWinners}
                        onChange={(e) =>
                          patchSeg(s.id, {
                            remainingWinners: Math.max(0, Number(e.target.value)),
                          })
                        }
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Odds (weight)">
                    <input
                      type="number"
                      min={0}
                      className={`${inputCls} w-24`}
                      value={s.odds}
                      onChange={(e) =>
                        patchSeg(s.id, {
                          odds: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                  </Field>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase text-white/40">
                    {soldOut ? "Sold Out" : "Active"}
                  </span>
                  <button
                    onClick={() => patchSeg(s.id, { active: !s.active })}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.active ? "bg-emerald-600" : "bg-white/20"
                    }`}
                  >
                    {s.active ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() =>
                      setSegments((segs) => segs.filter((x) => x.id !== s.id))
                    }
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-white/40">
          {mode === "count" ? (
            <>
              Winner selection is weighted by <b>Remaining</b>. A segment at 0 is
              excluded and marked SOLD OUT automatically.
            </>
          ) : (
            <>
              Winner selection is weighted by <b>Odds</b> across active segments.
              Higher odds = more likely. Counts are logged but never run out.
            </>
          )}{" "}
          Remember to Save Segments.
        </p>
      </Card>

      {/* Winners by segment */}
      {mode === "count" && (
        <Card title="Winners by Segment">
          <div className="space-y-2">
            {segments.map((s) => {
              const awarded = s.totalWinners - s.remainingWinners;
              const pct = s.totalWinners ? (awarded / s.totalWinners) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded"
                    style={{ background: s.color }}
                  />
                  <span className="w-40 truncate text-sm">{s.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm tabular-nums text-white/60">
                    {awarded}/{s.totalWinners}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Campaign controls */}
      <Card title="Campaign Controls">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runControl("start")}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-bold hover:bg-emerald-500"
          >
            ▶ Start
          </button>
          <button
            onClick={() => runControl("pause")}
            className="rounded-lg bg-amber-600 px-5 py-2.5 font-bold hover:bg-amber-500"
          >
            ⏸ Pause
          </button>
          <button
            onClick={() =>
              setConfirm({
                title: "Start a New Day?",
                message:
                  "Restore every gift's remaining count to its daily total. The spin log is kept for reporting.",
                action: "start-new-day",
              })
            }
            className="rounded-lg bg-sky-600 px-5 py-2.5 font-bold hover:bg-sky-500"
          >
            🌅 Start New Day
          </button>
          <button
            onClick={() =>
              setConfirm({
                title: "Reset Winner Counts?",
                message:
                  "Restore every segment's remaining winners to its total. This cannot be undone.",
                action: "reset-winners",
              })
            }
            className="rounded-lg bg-white/10 px-5 py-2.5 font-bold hover:bg-white/20"
          >
            Reset Winner Counts
          </button>
          <button
            onClick={() =>
              setConfirm({
                title: "Reset Spin Count?",
                message: "Delete the entire spin history. This cannot be undone.",
                action: "reset-spins",
              })
            }
            className="rounded-lg bg-white/10 px-5 py-2.5 font-bold hover:bg-white/20"
          >
            Reset Spin Count
          </button>
          <button
            onClick={() =>
              setConfirm({
                title: "Reset EVERYTHING?",
                message:
                  "Clear spin history AND restore all winner counts, and resume the campaign. This cannot be undone.",
                action: "reset-all",
              })
            }
            className="rounded-lg bg-red-600 px-5 py-2.5 font-bold hover:bg-red-500"
          >
            Reset Everything
          </button>
        </div>
      </Card>

      {/* Spin history */}
      <Card title={`Spin History (${spins.length})`}>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/80 text-white/50">
              <tr>
                <th className="px-3 py-2">Spin ID</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Winning Segment</th>
                <th className="px-3 py-2 text-right">Remaining After</th>
              </tr>
            </thead>
            <tbody>
              {spins.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    No spins recorded yet.
                  </td>
                </tr>
              )}
              {spins.map((sp) => {
                const d = new Date(sp.createdAt);
                return (
                  <tr key={sp.id} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-white/50">
                      {sp.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">{d.toLocaleDateString()}</td>
                    <td className="px-3 py-2">{d.toLocaleTimeString()}</td>
                    <td className="px-3 py-2 font-semibold">{sp.segmentName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {sp.remainingAfter}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        danger
        confirmText="Yes, proceed"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) runControl(confirm.action);
          setConfirm(null);
        }}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="color"
        className="h-10 w-16 rounded border border-white/10 bg-black/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
        active
          ? "border-brand-light bg-brand/30"
          : "border-white/10 bg-black/30 hover:bg-white/5"
      }`}
    >
      <span className="block font-bold">{title}</span>
      <span className="mt-1 block text-xs text-white/50">{desc}</span>
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
      <div className="mt-1 text-3xl font-black tabular-nums text-gold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <GameAAdmin />
    </AdminShell>
  );
}
