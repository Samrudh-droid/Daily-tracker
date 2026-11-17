import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Flame,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadError from '../components/LoadError';
import Skeleton from '../components/Skeleton';
import { api } from '../lib/api';
import {
  addLocalDays,
  formatDateLabel,
  formatShortDate,
  getLocalDateString,
  getMonday,
} from '../lib/date';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function HabitsPage() {
  const today = getLocalDateString();
  const weekStart = useMemo(() => getMonday(today), [today]);
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addLocalDays(weekStart, index)),
    [weekStart]
  );
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchHabits = useCallback(async () => {
    try {
      const { data } = await api.get('/habits', {
        params: { start: dates[0], end: dates[6], asOf: today },
      });
      setHabits(data.habits);
      setLoadError('');
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load habits.'));
      throw error;
    }
  }, [dates, today]);

  useEffect(() => {
    fetchHabits()
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load habits.')))
      .finally(() => setLoading(false));
  }, [fetchHabits]);

  async function addHabit(event) {
    event.preventDefault();
    const habitName = name.trim();
    if (!habitName) return;
    setSaving(true);
    try {
      await api.post('/habits', { name: habitName, createdDate: today });
      await fetchHabits();
      setName('');
      toast.success('Habit added');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add habit.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveName(habitId) {
    try {
      await api.patch(`/habits/${habitId}`, { name: editingName });
      await fetchHabits();
      setEditingId(null);
      toast.success('Habit updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update habit.'));
    }
  }

  async function deleteHabit(habit) {
    if (!window.confirm(`Delete "${habit.name}" and all of its history?`)) return;
    try {
      await api.delete(`/habits/${habit.id}`);
      setHabits((current) => current.filter((item) => item.id !== habit.id));
      toast.success('Habit and its logs deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete habit.'));
    }
  }

  async function cycleLog(habit, date) {
    const currentStatus = habit.logs.find((log) => log.date === date)?.status;
    const nextStatus =
      currentStatus === undefined
        ? 'done'
        : currentStatus === 'done'
          ? 'missed'
          : null;

    try {
      if (nextStatus) {
        await api.put(`/habits/${habit.id}/logs/${date}`, { status: nextStatus });
      } else {
        await api.delete(`/habits/${habit.id}/logs/${date}`);
      }
      await fetchHabits();
      toast.success(
        nextStatus === 'done'
          ? 'Habit marked done'
          : nextStatus === 'missed'
            ? 'Habit marked missed'
            : 'Habit check cleared'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update habit log.'));
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Build your rhythm</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Habits that add up.
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Keep the routines you care about close, and notice how far you’ve come.
        </p>
      </section>

      <form onSubmit={addHabit} className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
        <label className="sr-only" htmlFor="new-habit">Habit name</label>
        <input
          id="new-habit"
          className="field-control flex-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="e.g. Read for 20 minutes"
        />
        <button type="submit" className="primary-button" disabled={saving || !name.trim()}>
          <Plus size={18} /> {saving ? 'Adding…' : 'Add habit'}
        </button>
      </form>

      <section className="card-surface overflow-hidden">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-end sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Your habit week</h2>
            <p className="mt-1 text-xs text-slate-400">
              {formatDateLabel(dates[0])} – {formatDateLabel(dates[6])}
            </p>
          </div>
          <p className="text-xs text-slate-400">Tap a day to cycle through done, missed, and clear.</p>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : loadError ? (
          <LoadError
            message={loadError}
            onRetry={() => {
              setLoading(true);
              fetchHabits()
                .catch((error) =>
                  toast.error(getErrorMessage(error, 'Could not load habits.'))
                )
                .finally(() => setLoading(false));
            }}
          />
        ) : habits.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Flame size={25} aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">Start with one small habit</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a routine above and check in whenever you show up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="grid grid-cols-[minmax(90px,1fr)_repeat(7,minmax(28px,48px))] gap-1 px-3 py-3 sm:grid-cols-[minmax(180px,1.3fr)_repeat(7,minmax(40px,1fr))] sm:gap-2 sm:px-5">
              <span className="self-end pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                Habit
              </span>
              {dates.map((date) => (
                <span key={date} className="text-center">
                  <span className="block text-[9px] text-slate-400 sm:text-[10px]">
                    {formatShortDate(date).split(' ')[0]}
                  </span>
                  <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {Number(date.slice(-2))}
                  </span>
                </span>
              ))}
            </div>
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="grid grid-cols-[minmax(90px,1fr)_repeat(7,minmax(28px,48px))] items-center gap-1 px-3 py-4 sm:grid-cols-[minmax(180px,1.3fr)_repeat(7,minmax(40px,1fr))] sm:gap-2 sm:px-5"
              >
                <div className="min-w-0 pr-1">
                  {editingId === habit.id ? (
                    <form
                      className="flex items-center gap-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveName(habit.id);
                      }}
                    >
                      <input
                        autoFocus
                        className="field-control min-w-0 px-2 py-2 text-xs"
                        aria-label="Edit habit name"
                        value={editingName}
                        maxLength={80}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                      <button className="icon-button !h-8 !min-h-8 !w-8 !min-w-8 text-indigo-600" aria-label="Save habit name">
                        <Save size={15} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
                        {habit.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Flame size={11} className="text-amber-500" aria-hidden="true" />
                        {habit.currentStreak} current · {habit.longestStreak} best
                      </p>
                      <div className="mt-1 flex">
                        <button
                          type="button"
                          className="icon-button !h-7 !min-h-7 !w-7 !min-w-7"
                          aria-label={`Edit ${habit.name}`}
                          onClick={() => {
                            setEditingId(habit.id);
                            setEditingName(habit.name);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="icon-button !h-7 !min-h-7 !w-7 !min-w-7 hover:text-rose-600"
                          aria-label={`Delete ${habit.name}`}
                          onClick={() => deleteHabit(habit)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {dates.map((date) => {
                  const status = habit.logs.find((log) => log.date === date)?.status;
                  const beforeCreated = date < habit.createdDate;
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={beforeCreated}
                      onClick={() => cycleLog(habit, date)}
                      className={`mx-auto grid h-8 w-8 place-items-center rounded-xl transition sm:h-10 sm:w-10 ${
                        beforeCreated
                          ? 'cursor-not-allowed bg-transparent text-slate-200 dark:text-slate-700'
                          : status === 'done'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300'
                            : status === 'missed'
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-400/15 dark:text-rose-300'
                              : 'bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-indigo-400/10'
                      }`}
                      aria-label={
                        beforeCreated
                          ? `${habit.name} was not active on ${formatDateLabel(date)}`
                          : `${habit.name} on ${formatDateLabel(date)}: ${status || 'unmarked'}; change status`
                      }
                      title={formatDateLabel(date)}
                    >
                      {status === 'done' ? (
                        <Check size={17} />
                      ) : status === 'missed' ? (
                        <X size={16} />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
