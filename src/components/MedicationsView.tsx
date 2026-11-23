import React, { useMemo } from 'react';
import { Bell, BellOff, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AdherenceLog, Medication } from '../types/care';
import { getOffsetDayKey, getTodayDayKey } from '../services/careFirestore';
import { formatTime } from '../utils/formatters';

interface MedicationsViewProps {
  medications: Medication[];
  adherenceLogs: AdherenceLog[];
  onAdd: () => void;
  onEdit: (med: Medication) => void;
  onDelete: (med: Medication) => void;
  onToggleTaken: (med: Medication) => void;
  onToggleReminder: (med: Medication) => void;
}

interface DayAdherencePoint {
  dayKey: string;
  label: string;
  fullDate: string;
  takenCount: number;
  scheduledCount: number;
  pct: number;
}

function AdherenceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DayAdherencePoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border border-[#DCE6DF] rounded-xl px-3.5 py-2.5 shadow-sm text-xs">
      <p className="font-semibold text-[#14221B]">{point.fullDate}</p>
      <p className="text-[#1F7A53] font-bold tabular-nums mt-0.5">
        {point.pct}% adherence
      </p>
      <p className="text-[#4A5F53] tabular-nums">
        {point.takenCount} of {point.scheduledCount} doses logged
      </p>
    </div>
  );
}

export function MedicationsView({
  medications,
  adherenceLogs,
  onAdd,
  onEdit,
  onDelete,
  onToggleTaken,
  onToggleReminder,
}: MedicationsViewProps) {
  const today = getTodayDayKey();
  const sorted = [...medications].sort(
    (a, b) => a.timeHour * 60 + a.timeMinute - (b.timeHour * 60 + b.timeMinute)
  );

  const { chartData, weeklyPct, totalTakenWeek, totalScheduledWeek, todayTaken } =
    useMemo(() => {
      const scheduledPerDay = medications.length;
      const logsByDay = new Map<string, Set<string>>();

      for (const log of adherenceLogs) {
        if (!logsByDay.has(log.dayKey)) {
          logsByDay.set(log.dayKey, new Set());
        }
        logsByDay.get(log.dayKey)!.add(log.medicationId);
      }

      // Sync today's count with live medication documents as well
      const todayMedSet = new Set<string>(logsByDay.get(today) ?? []);
      for (const med of medications) {
        if (med.lastTakenDay === today) {
          const safeMedId = med.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || med.id;
          todayMedSet.add(safeMedId);
        }
      }
      logsByDay.set(today, todayMedSet);

      const points: DayAdherencePoint[] = [];
      let sumTaken = 0;

      for (let offset = -6; offset <= 0; offset++) {
        const dayKey = getOffsetDayKey(offset);
        const dt = new Date();
        dt.setDate(dt.getDate() + offset);
        const label =
          offset === 0
            ? 'Today'
            : dt.toLocaleDateString([], { weekday: 'short' });
        const fullDate =
          offset === 0
            ? `Today · ${dt.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
            : dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

        const rawTaken = logsByDay.get(dayKey)?.size ?? 0;
        const takenCount =
          scheduledPerDay > 0 ? Math.min(scheduledPerDay, rawTaken) : rawTaken;
        const pct =
          scheduledPerDay > 0
            ? Math.min(100, Math.round((takenCount / scheduledPerDay) * 100))
            : 0;

        sumTaken += takenCount;
        points.push({
          dayKey,
          label,
          fullDate,
          takenCount,
          scheduledCount: scheduledPerDay,
          pct,
        });
      }

      const totalScheduled = scheduledPerDay * 7;
      const avgPct =
        totalScheduled > 0
          ? Math.min(100, Math.round((sumTaken / totalScheduled) * 100))
          : 0;
      const takenToday = medications.filter((m) => m.lastTakenDay === today).length;

      return {
        chartData: points,
        weeklyPct: avgPct,
        totalTakenWeek: sumTaken,
        totalScheduledWeek: totalScheduled,
        todayTaken: takenToday,
      };
    }, [adherenceLogs, medications, today]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14221B]">Medications</h1>
          <p className="text-sm text-[#4A5F53]">
            Manage daily medicines, dosage instructions, and reminder times
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#176040] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      <section
        aria-label="Medication Adherence"
        className="bg-white border border-[#DCE6DF] rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#14221B]">Medication Adherence</h2>
            <p className="text-xs text-[#4A5F53]">
              7-day daily completion trend across scheduled doses
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E4EEE8]">
            <div>
              <p className="text-xs text-[#4A5F53]">Weekly Rate</p>
              <p className="text-xl font-bold text-[#1F7A53] tabular-nums">{weeklyPct}%</p>
            </div>
            <div>
              <p className="text-xs text-[#4A5F53]">Doses Logged</p>
              <p className="text-xl font-bold text-[#14221B] tabular-nums">
                {totalTakenWeek}
                <span className="text-sm font-medium text-[#4A5F53]">
                  /{totalScheduledWeek}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#4A5F53]">Today</p>
              <p className="text-xl font-bold text-[#14221B] tabular-nums">
                {todayTaken}
                <span className="text-sm font-medium text-[#4A5F53]">
                  /{medications.length}
                </span>
              </p>
            </div>
          </div>
        </div>

        {medications.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center rounded-xl bg-[#F6FAF7] border border-[#E4EEE8] px-4 text-center">
            <p className="text-sm text-[#4A5F53]">
              Add a scheduled medicine below to begin tracking your 7-day adherence trend.
            </p>
          </div>
        ) : (
          <div className="w-full min-w-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adherenceAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F7A53" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#1F7A53" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EEE8" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#4A5F53', fontSize: 12 }}
                  axisLine={{ stroke: '#DCE6DF' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#4A5F53', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AdherenceTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="#1F7A53"
                  strokeWidth={2.5}
                  fill="url(#adherenceAreaFill)"
                  dot={{ r: 3.5, fill: '#1F7A53', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: '#1F7A53', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {sorted.length === 0 ? (
        <div className="bg-white border border-[#DCE6DF] rounded-2xl p-8 text-center space-y-3">
          <p className="text-base font-semibold text-[#14221B]">No medications scheduled</p>
          <p className="text-sm text-[#4A5F53]">
            Add daily medicines to track dosages and reminders.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040]"
          >
            Add First Medicine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((med) => {
            const isTaken = med.lastTakenDay === today;
            return (
              <div
                key={med.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  isTaken
                    ? 'bg-[#F0F7F3] border-[#CBE4D4]'
                    : 'bg-white border-[#DCE6DF]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-semibold text-[#1F7A53] tabular-nums">
                        {formatTime(med.timeHour, med.timeMinute)} · {med.dosage}
                      </p>
                      <h2 className="text-xl font-bold text-[#14221B] truncate">{med.name}</h2>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(med)}
                        aria-label={`Edit ${med.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(med)}
                        aria-label={`Delete ${med.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C62828] hover:bg-[#FDECEC]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {med.instructions && (
                    <p className="text-sm text-[#4A5F53] leading-relaxed">{med.instructions}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E4EEE8] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleReminder(med)}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-[#4A5F53] hover:bg-[#EDF4EF] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {med.reminderEnabled ? (
                      <>
                        <Bell className="w-4 h-4 text-[#1F7A53]" />
                        <span>Reminder On</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-[#7A9185]" />
                        <span>Reminder Paused</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleTaken(med)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      isTaken
                        ? 'bg-[#DDF3E7] text-[#0D3B26] hover:bg-[#CCEAD9]'
                        : 'bg-[#1F7A53] text-white hover:bg-[#176040]'
                    }`}
                  >
                    {isTaken && <CheckCircle2 className="w-4 h-4" />}
                    <span>
                      {isTaken
                        ? `Taken${med.lastTakenTimeLabel ? ` · ${med.lastTakenTimeLabel}` : ''}`
                        : 'Mark Taken'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
