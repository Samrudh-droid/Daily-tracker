import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addMonths, format, subMonths } from 'date-fns';
import { Activity, CalendarCheck, ChevronLeft, ChevronRight, Flame, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadError from '../components/LoadError';
import Skeleton from '../components/Skeleton';
import StatCard from '../components/StatCard';
import { api } from '../lib/api';
import {
  formatDateLabel,
  formatShortDate,
  getLocalDateString,
  getMonthKey,
  parseLocalDate,
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

function Heatmap({ days, month }) {
  const firstDay = parseLocalDate(`${month}-01`);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const cells = [...Array(mondayOffset).fill(null), ...days];

  function getCellTone(day) {
    if (!day || day.habits.tracked === 0) {
      return 'bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-700';
    }
    if (day.habits.completionPercent === 100) {
      return 'bg-emerald-500 text-white';
    }
    if (day.habits.completionPercent >= 50) {
      return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/40 dark:text-emerald-100';
    }
    if (day.habits.completionPercent > 0) {
      return 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100';
    }
    return 'bg-rose-100 text-rose-900 dark:bg-rose-500/25 dark:text-rose-100';
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-slate-400 sm:gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((day, index) => (
          <div
            key={day?.date || `blank-${index}`}
            title={day ? `${formatDateLabel(day.date)} · ${day.habits.tracked === 0 ? 'not yet tracked' : `${day.habits.completionPercent}% habits`}` : undefined}
            aria-label={day ? `${formatDateLabel(day.date)}: ${day.habits.tracked === 0 ? 'not yet tracked' : `${day.habits.completionPercent}% habit completion`}` : undefined}
            className={`grid aspect-square min-h-9 place-items-center rounded-xl text-xs font-semibold sm:min-h-11 ${getCellTone(day)}`}
          >
            {day ? Number(day.date.slice(-2)) : ''}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
        {[
          ['bg-rose-100', '0%'],
          ['bg-amber-100', '1–49%'],
          ['bg-emerald-200', '50–99%'],
          ['bg-emerald-500', '100%'],
        ].map(([tone, label]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${tone}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MonthlyReportPage() {
  const today = getLocalDateString();
  const [month, setMonth] = useState(() => getMonthKey(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api
      .get('/reports/monthly', { params: { month, today } })
      .then(({ data }) => {
        if (active) setReport(data);
      })
      .catch((error) => {
        const message =
          error.response?.data?.message || 'Could not load monthly report.';
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
  }, [month, today, retry]);

  const chartDays = useMemo(
    () =>
      report?.days.map((day) => ({
        ...day,
        label: formatShortDate(day.date),
      })) || [],
    [report]
  );

  function moveMonth(amount) {
    const date = parseLocalDate(`${month}-01`);
    const nextMonth = amount < 0 ? subMonths(date, 1) : addMonths(date, 1);
    setMonth(getMonthKey(
      `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
    ));
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">A wider view of your progress</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Monthly report
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Celebrate the patterns you’re building, not just the finish line.
          </p>
        </div>
        <div className="card-surface flex items-center gap-1 p-2">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <label className="relative min-w-32 text-center">
            <span className="block px-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {format(parseLocalDate(`${month}-01`), 'MMMM yyyy')}
            </span>
            <span className="sr-only">Choose report month</span>
            <input
              type="month"
              value={month}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Choose report month"
            />
          </label>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => moveMonth(1)}
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
              detail={`${report.totals.tasks.done} done of ${report.totals.tasks.eligible} active`}
              icon={Target}
              tone="indigo"
            />
            <StatCard
              label="Habit completion"
              value={`${report.totals.habits.completionPercent}%`}
              detail={`${report.totals.habits.done} completed check-ins`}
              icon={Activity}
              tone="emerald"
            />
            <StatCard
              label="Perfect habit days"
              value={report.daysWith100PercentHabitCompletion}
              detail="Days with every active habit done"
              icon={CalendarCheck}
              tone="amber"
            />
            <StatCard
              label="Active habits"
              value={report.habits.length}
              detail="Habits created by this month"
              icon={Flame}
              tone="rose"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
            <ChartCard title="Daily task progress" subtitle="Completion percent for each date in the selected month.">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDays}>
                    <defs>
                      <linearGradient id="taskProgressFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="label" interval="preserveStartEnd" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? formatDateLabel(payload[0].payload.date) : ''}
                      formatter={(value) => [`${value}%`, 'Task completion']}
                      contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="tasks.completionPercent" stroke="#6366f1" strokeWidth={2.5} fill="url(#taskProgressFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Habit completion calendar" subtitle="Daily share of habits completed after they became active.">
              <Heatmap days={report.days} month={month} />
            </ChartCard>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <ChartCard title="Week-by-week" subtitle="Task completion across each calendar week in this month.">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.weeks.map((week, index) => ({
                    ...week,
                    label: `Week ${index + 1}`,
                    completion: week.totals.tasks.completionPercent,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload ? `${formatDateLabel(payload[0].payload.start)} – ${formatDateLabel(payload[0].payload.end)}` : ''}
                      formatter={(value) => [`${value}%`, 'Completion']}
                      contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="completion" name="Task completion" fill="#8b5cf6" radius={[8, 8, 0, 0]} maxBarSize={54} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Habit consistency" subtitle="Completion, missed days, and your current and longest streaks.">
              {report.habits.length === 0 ? (
                <div className="grid h-[250px] place-items-center text-center text-sm text-slate-500 dark:text-slate-400">
                  Add a habit to see its monthly consistency.
                </div>
              ) : (
                <div className="space-y-5">
                  {report.habits.map((habit) => (
                    <div key={habit.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{habit.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {habit.done} done · {habit.missed} missed · {habit.unmarked} unmarked
                          </p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                          {habit.completionPercent}%
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                        role="progressbar"
                        aria-label={`${habit.name} completion`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={habit.completionPercent}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                          style={{ width: `${habit.completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Flame size={12} className="text-amber-500" /> {habit.currentStreak} current streak</span>
                        <span>{habit.longestStreak} longest</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {[
              ['Best day', report.bestDay],
              ['A day to reset', report.worstDay],
            ].map(([label, day]) => (
              <article key={label} className="card-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                {day ? (
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="font-semibold text-slate-800 dark:text-white">{formatDateLabel(day.date)}</p>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{day.completionPercent}%</span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No active tasks for this month yet.</p>
                )}
              </article>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
