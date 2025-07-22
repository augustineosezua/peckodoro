import { useRef } from "react";

export const Rail = ({ title, children, empty }) => {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3 px-1">{title}</h2>

      {empty ? (
        <p className="text-sm text-[#b3b3b3] px-1">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="relative group">
          {/* Scroll buttons */}
          <button
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center 
                      rounded-full bg-black/70 hover:bg-[#1DB954] transition-all duration-200 ease-in-out opacity-0 
                      group-hover:opacity-100"
          >
            <span className="text-white text-xl font-bold">‹</span>
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center 
                      rounded-full bg-black/70 hover:bg-[#1DB954] transition-all duration-200 ease-in-out opacity-0 
                      group-hover:opacity-100"
          >
            <span className="text-white text-xl font-bold">›</span>
          </button>

          <div
            ref={ref}
            tabIndex={0}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-1 focus:outline-none"
          >
            {children}
          </div>

          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#121212] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-[#121212] to-transparent" />
        </div>
      )}
    </section>
  );
};
