export default function ProgressRing({ value = 0, label = 'complete' }) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div
      className="relative grid h-24 w-24 place-items-center"
      role="img"
      aria-label={`${Math.round(normalizedValue)} percent ${label}`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-slate-100 dark:text-slate-700"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-indigo-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute text-lg font-bold text-slate-800 dark:text-white">
        {Math.round(normalizedValue)}%
      </span>
    </div>
  );
}
