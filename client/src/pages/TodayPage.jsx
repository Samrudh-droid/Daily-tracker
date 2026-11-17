import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import LoadError from '../components/LoadError';
import ProgressRing from '../components/ProgressRing';
import Skeleton from '../components/Skeleton';
import { api } from '../lib/api';
import {
  addLocalDays,
  formatDateLabel,
  getLocalDateString,
} from '../lib/date';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function EmptyState({ title, description, action }) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300">
        <CircleHelp size={25} aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action}
    </div>
  );
}

export default function TodayPage() {
  const [date, setDate] = useState(getLocalDateString);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadDay = useCallback(async ({ notify = true, showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setLoadError('');
    try {
      const [taskResponse, habitResponse] = await Promise.all([
        api.get('/tasks', { params: { date } }),
        api.get('/habits', {
          params: { start: date, end: date, asOf: getLocalDateString() },
        }),
      ]);
      setTasks(taskResponse.data.tasks);
      setHabits(habitResponse.data.habits);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not load this day.');
      setLoadError(message);
      if (notify) toast.error(message);
      throw error;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadDay().catch(() => {});
  }, [loadDay]);

  const taskStats = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== 'cancelled');
    const done = activeTasks.filter((task) => task.status === 'done').length;
    return {
      done,
      active: activeTasks.length,
      cancelled: tasks.length - activeTasks.length,
      percent: activeTasks.length ? (done / activeTasks.length) * 100 : 0,
    };
  }, [tasks]);

  async function addTask(event) {
    event.preventDefault();
    const taskTitle = title.trim();
    if (!taskTitle) return;

    setSavingTask(true);
    try {
      const { data } = await api.post('/tasks', { title: taskTitle, date });
      setTasks((currentTasks) => [...currentTasks, data.task]);
      setTitle('');
      toast.success('Task added');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add task.'));
    } finally {
      setSavingTask(false);
    }
  }

  async function changeTask(taskId, updates, successMessage) {
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, updates);
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? data.task : task))
      );
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update task.'));
      return false;
    }
  }

  async function saveTaskTitle(taskId) {
    const saved = await changeTask(
      taskId,
      { title: editingTitle },
      'Task updated'
    );
    if (saved) setEditingId(null);
  }

  async function deleteTask(task) {
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete task.'));
    }
  }

  async function changeHabitLog(habit, status) {
    try {
      if (status) {
        await api.put(`/habits/${habit.id}/logs/${date}`, { status });
      } else {
        await api.delete(`/habits/${habit.id}/logs/${date}`);
      }
      await loadDay({ notify: false, showLoading: false });
      toast.success(status ? 'Habit updated' : 'Habit check cleared');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update habit.'));
    }
  }

  function getHabitStatus(habit) {
    return habit.logs.find((log) => log.date === date)?.status;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            Your daily overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Today, made intentional.
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A few thoughtful steps are enough to make progress.
          </p>
        </div>
        <div className="card-surface flex items-center justify-between gap-2 p-2 sm:justify-start">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous day"
            onClick={() => setDate((currentDate) => addLocalDays(currentDate, -1))}
          >
            <ChevronLeft size={19} />
          </button>
          <label className="relative min-w-0 text-center">
            <span className="sr-only">Choose date</span>
            <span className="block whitespace-nowrap px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatDateLabel(date)}
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Choose date"
            />
          </label>
          <button
            type="button"
            className="icon-button"
            aria-label="Next day"
            onClick={() => setDate((currentDate) => addLocalDays(currentDate, 1))}
          >
            <ChevronRight size={19} />
          </button>
          <button
            type="button"
            className="quiet-button ml-1 !px-3 !py-2 text-xs"
            onClick={() => setDate(getLocalDateString())}
          >
            Today
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.5fr]">
        <article className="card-surface flex items-center gap-5 p-5 sm:p-6">
          <ProgressRing value={taskStats.percent} label="of active tasks complete" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Task progress
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {taskStats.done} of {taskStats.active} done
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {taskStats.cancelled} cancelled · excluded from progress
            </p>
          </div>
        </article>
        <form onSubmit={addTask} className="card-surface flex items-center gap-3 p-3 sm:p-4">
          <label className="sr-only" htmlFor="new-task">
            New task title
          </label>
          <input
            id="new-task"
            className="field-control min-w-0 border-transparent bg-slate-50/80 dark:border-transparent dark:bg-slate-900"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="What would you like to get done?"
          />
          <button type="submit" className="primary-button shrink-0" disabled={savingTask || !title.trim()}>
            <Plus size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{savingTask ? 'Adding' : 'Add task'}</span>
          </button>
        </form>
      </section>

      {loadError && (
        <LoadError
          message={loadError}
          onRetry={() => loadDay().catch(() => {})}
        />
      )}

      <section className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Your tasks</h2>
              <p className="mt-1 text-xs text-slate-400">
                Green for done, rose for missed, or cancel what no longer matters.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {tasks.length}
            </span>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : loadError ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Tasks are unavailable until this day loads.
            </p>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="A clear page for today"
              description="Add one small task above and give your day a gentle starting point."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => {
                const isCancelled = task.status === 'cancelled';
                return (
                  <li
                    key={task.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-4 transition sm:flex-nowrap sm:px-6 ${
                      isCancelled ? 'bg-slate-50/70 dark:bg-slate-900/50' : ''
                    }`}
                  >
                    {editingId === task.id ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveTaskTitle(task.id);
                        }}
                      >
                        <input
                          autoFocus
                          className="field-control min-w-0 flex-1 py-2"
                          aria-label="Edit task title"
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          maxLength={200}
                        />
                        <button className="icon-button text-indigo-600" aria-label="Save task title">
                          <Save size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Cancel editing"
                          onClick={() => setEditingId(null)}
                        >
                          <X size={17} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span
                          className={`min-w-0 flex-1 break-words text-sm font-medium ${
                            isCancelled
                              ? 'text-slate-400 line-through'
                              : task.status === 'done'
                                ? 'text-slate-400 line-through'
                                : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={`icon-button !h-9 !min-h-9 !w-9 !min-w-9 ${
                              task.status === 'done'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
                                : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300'
                            }`}
                            aria-label={`Mark ${task.title} done`}
                            onClick={() => changeTask(task.id, { status: 'done' }, 'Task marked done')}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            type="button"
                            className={`icon-button !h-9 !min-h-9 !w-9 !min-w-9 ${
                              task.status === 'missed'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300'
                                : 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-300'
                            }`}
                            aria-label={`Mark ${task.title} missed`}
                            onClick={() => changeTask(task.id, { status: 'missed' }, 'Task marked missed')}
                          >
                            <X size={18} />
                          </button>
                          {task.status !== 'cancelled' ? (
                            <button
                              type="button"
                              className="icon-button !h-9 !min-h-9 !w-9 !min-w-9 hover:text-slate-700 dark:hover:text-slate-200"
                              aria-label={`Cancel ${task.title}`}
                              title="Cancel"
                              onClick={() => changeTask(task.id, { status: 'cancelled' }, 'Task cancelled')}
                            >
                              <Ban size={17} />
                            </button>
                          ) : null}
                          {task.status !== 'pending' && (
                            <button
                              type="button"
                              className="icon-button !h-9 !min-h-9 !w-9 !min-w-9"
                              aria-label={`Reset ${task.title} to pending`}
                              title="Reset to pending"
                              onClick={() => changeTask(task.id, { status: 'pending' }, 'Task reset')}
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-button !h-9 !min-h-9 !w-9 !min-w-9"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => {
                              setEditingId(task.id);
                              setEditingTitle(task.title);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-button !h-9 !min-h-9 !w-9 !min-w-9 hover:text-rose-600"
                            aria-label={`Delete ${task.title}`}
                            onClick={() => deleteTask(task)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Daily habits</h2>
              <p className="mt-1 text-xs text-slate-400">Your steady routines, one check at a time.</p>
            </div>
            <Link to="/habits" className="text-xs font-semibold text-indigo-600 hover:text-violet-600 dark:text-indigo-300">
              Manage
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : loadError ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Habits are unavailable until this day loads.
            </p>
          ) : habits.length === 0 ? (
            <EmptyState
              title="Start a habit that matters"
              description="Add a daily routine and make progress by showing up consistently."
              action={
                <Link to="/habits" className="primary-button mt-5">
                  <Plus size={17} /> Add a habit
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {habits.map((habit) => {
                const status = getHabitStatus(habit);
                return (
                  <li key={habit.id} className="flex items-center gap-3 px-5 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {habit.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {habit.currentStreak} day streak
                      </span>
                    </span>
                    <button
                      type="button"
                      className={`icon-button ${
                        status === 'done'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
                          : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-400/10'
                      }`}
                      aria-label={`Mark ${habit.name} done`}
                      onClick={() => changeHabitLog(habit, 'done')}
                    >
                      <Check size={19} />
                    </button>
                    <button
                      type="button"
                      className={`icon-button ${
                        status === 'missed'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300'
                          : 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10'
                      }`}
                      aria-label={`Mark ${habit.name} missed`}
                      onClick={() => changeHabitLog(habit, 'missed')}
                    >
                      <X size={19} />
                    </button>
                    {status && (
                      <button
                        type="button"
                        className="icon-button !min-w-8"
                        aria-label={`Clear ${habit.name} check`}
                        onClick={() => changeHabitLog(habit, null)}
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
