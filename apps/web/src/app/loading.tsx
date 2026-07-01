export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-loading-bar rounded-full bg-ink-900" />
    </div>
  );
}
