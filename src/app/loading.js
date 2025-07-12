export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8fa]">
      <div className="w-12 h-12 mb-6 border-4 border-[#e3e7ee] border-t-[#2864F0] rounded-full animate-spin" />
      <span className="text-[#2864F0] font-semibold text-lg">
        Loading page...
      </span>
    </div>
  );
}
