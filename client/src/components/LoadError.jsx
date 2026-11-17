export default function LoadError({ message, onRetry }) {
  return (
    <div
      className="card-surface flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>
      <button type="button" className="quiet-button shrink-0" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
