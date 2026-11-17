export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-700/70 ${className}`}
      aria-hidden="true"
    />
  );
}
