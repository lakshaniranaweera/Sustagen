"use client";
import { useEffect, useState } from "react";
import AdminShell, { Card } from "@/components/AdminShell";
import { useToast, Spinner } from "@/components/ui";
import { loadState } from "@/lib/store";
import {
  wheelDailyReports,
  reflexDailyReports,
  buildCsv,
  downloadCsv,
  todayKey,
  type WheelDayReport,
  type ReflexDayReport,
} from "@/lib/report";
import type { AppState } from "@/lib/types";

function Reports() {
  const toast = useToast();
  const [state, setState] = useState<AppState | null>(null);
  const [wheel, setWheel] = useState<WheelDayReport[]>([]);
  const [reflex, setReflex] = useState<ReflexDayReport[]>([]);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setWheel(wheelDailyReports(s.spins, s.gameA.dayStartHour));
      setReflex(reflexDailyReports(s.sessions, s.gameB.dayStartHour));
    });
  }, []);

  if (!state) return <Spinner label="Loading reports…" />;

  const today = todayKey(state.gameA.dayStartHour);
  const wheelToday = wheel.find((r) => r.day === today);
  const reflexToday = reflex.find((r) => r.day === today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Reports — End of Day Counts</h1>
        <button
          onClick={() => {
            downloadCsv(`campaign-report-${today}.csv`, buildCsv(state));
            toast("CSV downloaded");
          }}
          className="rounded-lg bg-brand px-5 py-2.5 font-bold hover:bg-brand-light"
        >
          ⬇ Download CSV
        </button>
      </div>

      {/* Today summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="Spins Today" value={wheelToday?.totalSpins ?? 0} />
        <StatBox
          label="Gifts Issued Today"
          value={
            wheelToday
              ? wheelToday.perGift.reduce((a, g) => a + g.count, 0)
              : 0
          }
        />
        <StatBox label="Reflex Plays Today" value={reflexToday?.totalSessions ?? 0} />
        <StatBox label="Sharp Minds Today" value={reflexToday?.sharpMinds ?? 0} />
      </div>

      {/* Wheel per-day */}
      <Card title="🎡 Spin the Wheel — Daily Gift Counts">
        {wheel.length === 0 ? (
          <p className="py-6 text-center text-white/40">No spins recorded yet.</p>
        ) : (
          <div className="space-y-5">
            {wheel.map((r) => (
              <div key={r.day} className="rounded-xl border border-white/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-bold">
                    {r.day}
                    {r.day === today && (
                      <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs">
                        TODAY
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-white/60">
                    {r.totalSpins} spins
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {r.perGift.map((g) => (
                    <div
                      key={g.name}
                      className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm"
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="font-bold tabular-nums text-gold">
                        {g.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reflex per-day */}
      <Card title="⚡ Cognitive Test — Daily Play Counts">
        {reflex.length === 0 ? (
          <p className="py-6 text-center text-white/40">
            No sessions recorded yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2 text-right">Total Plays</th>
                <th className="px-3 py-2 text-right">Sharp Minds</th>
              </tr>
            </thead>
            <tbody>
              {reflex.map((r) => (
                <tr key={r.day} className="border-t border-white/5">
                  <td className="px-3 py-2 font-semibold">
                    {r.day}
                    {r.day === today && (
                      <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs">
                        TODAY
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.totalSessions}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gold">
                    {r.sharpMinds}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
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
      <Reports />
    </AdminShell>
  );
}
