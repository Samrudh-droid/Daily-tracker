export default function StatCard({ label, value, detail, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  };

  return (
    <article className="card-surface flex min-w-0 items-center gap-4 p-5">
      {Icon && (
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
      </div>
    </article>
  );
}
