import { format } from 'date-fns';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navigation = [
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/habits', label: 'Habits', icon: CheckCircle2 },
  { to: '/reports/weekly', label: 'Weekly report', icon: BarChart3 },
  { to: '/reports/monthly', label: 'Monthly report', icon: BarChart3 },
];

function NavigationLinks({ mobile = false }) {
  return navigation.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `group flex items-center ${mobile ? 'flex-col gap-1 px-2 py-2 text-[10px]' : 'gap-3 px-3 py-3 text-sm'} rounded-xl font-medium transition ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }`
      }
    >
      <Icon size={mobile ? 20 : 19} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const todayLabel = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="app-background min-h-screen text-slate-800 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 px-5 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 lg:flex">
        <NavLink to="/today" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={21} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Daily Tracker
            </span>
            <span className="text-xs text-slate-400">A little better, daily</span>
          </span>
        </NavLink>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>
        <nav className="flex flex-col gap-1">
          <NavigationLinks />
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:from-indigo-500/10 dark:to-violet-500/10">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            Keep your momentum
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Small, consistent actions make meaningful progress.
          </p>
          <ChevronRight className="mt-2 text-indigo-400" size={16} aria-hidden="true" />
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">
            {user?.name?.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user?.name}
            </span>
            <span className="block truncate text-xs text-slate-400">{user?.email}</span>
          </span>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/60 bg-white/75 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75 sm:px-7 lg:px-10">
          <div className="lg:hidden">
            <NavLink to="/today" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <span className="font-bold text-slate-900 dark:text-white">Daily Tracker</span>
            </NavLink>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Your personal space
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{todayLabel}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="quiet-button hidden sm:inline-flex"
              aria-label="Log out"
            >
              <LogOut size={16} aria-hidden="true" />
              Log out
            </button>
            <button
              type="button"
              onClick={logout}
              className="icon-button sm:hidden"
              aria-label="Log out"
            >
              <LogOut size={19} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="page-enter mx-auto w-full max-w-[1440px] px-4 pb-28 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <NavigationLinks mobile />
      </nav>
    </div>
  );
}
