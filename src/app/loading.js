export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ink">
      <div className="w-10 h-10 border-4 border-ink/15 border-t-ink rounded-full animate-spin motion-reduce:animate-none" />
      <span className="font-semibold">Loading...</span>
    </div>
  );
}
