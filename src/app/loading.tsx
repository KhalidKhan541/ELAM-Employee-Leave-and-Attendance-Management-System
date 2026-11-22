export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto h-1.5 w-12 animate-pulse rounded-full bg-accent-600" />
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}
