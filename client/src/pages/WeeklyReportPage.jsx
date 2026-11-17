import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Check, ChevronLeft, ChevronRight, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadError from '../components/LoadError';
import Skeleton from '../components/Skeleton';
import StatCard from '../components/StatCard';
import { api } from '../lib/api';
import {
  addLocalDays,
  formatDateLabel,
  formatShortDate,
  getLocalDateString,
  getMonday,
} from '../lib/date';

function ChartCard({ title, subtitle, children }) {
  return (
    <article className="card-surface min-w-0 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </article>
  );
}

function formatWeekRange(start, end) {
  return `${formatDateLabel(start)} – ${formatDateLabel(end)}`;
}

function HabitGrid({ habits, days }) {
  const today = getLocalDateString();
  if (!habits.length) {
    return (
      <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        Add habits to see your weekly check-in grid.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[610px] border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr className="text-xs text-slate-400">
            <th className="px-3 py-2 text-left font-medium">Habit</th>
            {days.map((day) => (
              <th
                key={day.date}
                className="px-2 py-2 text-center font-medium"
                title={formatDateLabel(day.date)}
                aria-label={formatDateLabel(day.date)}
              >
                <span className="block">{day.weekday}</span>
                <span className="mt-0.5 block text-[10px]">{Number(day.date.slice(-2))}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr key={habit.id} className="rounded-xl bg-slate-50 dark:bg-slate-900/80">
              <th className="max-w-52 truncate rounded-l-xl px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                {habit.name}
              </th>
              {days.map((day) => {
                const habitDay = habit.days.find((item) => item.date === day.date);
                const status =
                  habitDay?.status ||
                  (day.date > today && day.date >= habit.createdDate
                    ? 'future'
                    : 'inactive');
                return (
                  <td key={day.date} className="px-2 py-2 text-center">
                    {status === 'done' ? (
                      <span className="mx-auto grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" aria-label="Done">
                        <Check size={15} />
                      </span>
                    ) : status === 'missed' ? (
                      <span className="mx-auto grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300" aria-label="Missed">
                        <X size={15} />
                      </span>
                    ) : status === 'unmarked' ? (
                      <span className="mx-auto block h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-label="Unmarked" />
                    ) : status === 'future' ? (
                      <span className="mx-auto block h-2 w-2 rounded-full bg-indigo-200 dark:bg-indigo-400/30" aria-label="Future date" />
                    ) : (
                      <span className="text-slate-200 dark:text-slate-700" aria-label="Not active">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WeeklyReportPage() {
  const today = getLocalDateString();
  const [start, setStart] = useState(() => getMonday(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api
      .get('/reports/weekly', { params: { start, today } })
      .then(({ data }) => {
        if (active) setReport(data);
      })
      .catch((error) => {
        const message =
          error.response?.data?.message || 'Could not load weekly report.';
        if (active) {
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [start, today, retry]);

  const chartDays = useMemo(
    () =>
      report?.days.map((day) => ({
        ...day,
        label: formatShortDate(day.date),
      })) || [],
    [report]
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Your week in review</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Weekly report
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            See the steady progress hidden in your everyday choices.
          </p>
        </div>
        <div className="card-surface flex items-center justify-between gap-1 p-2">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous week"
            onClick={() => setStart((value) => addLocalDays(value, -7))}
          >
            <ChevronLeft size={19} />
          </button>
          <label className="relative min-w-0 text-center">
            <span className="block whitespace-nowrap px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
              {report ? formatWeekRange(report.start, report.end) : formatDateLabel(start)}
            </span>
            <span className="sr-only">Choose a date in the week to report</span>
            <input
              type="date"
              value={start}
              onChange={(event) => {
                if (event.target.value) setStart(getMonday(event.target.value));
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Choose week"
            />
          </label>
          <button
            type="button"
            className="icon-button"
            aria-label="Next week"
            onClick={() => setStart((value) => addLocalDays(value, 7))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
      ) : loadError ? (
        <LoadError message={loadError} onRetry={() => setRetry((current) => current + 1)} />
      ) : report ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Task completion"
              value={`${report.totals.tasks.completionPercent}%`}
              detail={`${report.totals.tasks.done} of ${report.totals.tasks.eligible} active tasks`}
              icon={Target}
              tone="indigo"
            />
            <StatCard
              label="Tasks completed"
              value={report.totals.tasks.done}
              detail={`${report.totals.tasks.missed} missed · ${report.totals.tasks.pending} pending`}
              icon={Check}
              tone="emerald"
            />
            <StatCard
              label="Habit completion"
              value={`${report.totals.habits.completionPercent}%`}
              detail={`${report.totals.habits.done} completed check-ins`}
              icon={Activity}
              tone="amber"
            />
            <StatCard
              label="Habits to check in"
              value={report.totals.habits.active}
              detail={`${report.totals.habits.unmarked} unmarked days`}
              icon={X}
              tone="rose"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Task statuses" subtitle="A day-by-day look at done, missed, pending, and cancelled tasks.">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDays} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? formatDateLabel(payload[0].payload.date) : ''}
                      contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="tasks.done" name="Done" stackId="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tasks.missed" name="Missed" stackId="tasks" fill="#f43f5e" />
                    <Bar dataKey="tasks.pending" name="Pending" stackId="tasks" fill="#f59e0b" />
                    <Bar dataKey="tasks.cancelled" name="Cancelled" stackId="tasks" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Task completion trend" subtitle="Cancelled tasks are excluded from the daily completion percentage.">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDays}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? formatDateLabel(payload[0].payload.date) : ''}
                      formatter={(value) => [`${value}%`, 'Completion']}
                      contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0', fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="tasks.completionPercent" name="Completion" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>

          <ChartCard title="Habit check-ins" subtitle="A check means done, a cross means missed, and a dot means unmarked.">
            <HabitGrid habits={report.habits} days={report.days} />
          </ChartCard>

          <section className="grid gap-4 sm:grid-cols-2">
            {[['Best day', report.bestDay], ['A day to reset', report.worstDay]].map(([label, day]) => (
              <article key={label} className="card-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                {day ? (
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="font-semibold text-slate-800 dark:text-white">{formatDateLabel(day.date)}</p>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{day.completionPercent}%</span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No active tasks this week yet.</p>
                )}
              </article>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
