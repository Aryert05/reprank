// Pure presentational component — takes the `toasts` array produced by the
// useToast hook and renders it. Kept separate from the hook so the hook only
// holds logic/state and this component only holds markup.
export default function ToastViewport({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3
                     text-sm font-medium text-mist-100 shadow-card"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-volt" />
          {toast.message}
        </div>
      ))}
    </div>
  );
}
