import { useRef } from "react";

export const Rail = ({ title, children, empty }) => {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg lg:text-xl font-semibold mb-4 px-1 text-white">{title}</h2>

      {empty ? (
        <p className="text-sm text-[#b3b3b3] px-1">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="relative group">
          {/* Scroll buttons - only on desktop */}
          <button
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center 
                      rounded-full bg-black/80 hover:bg-[#1DB954] transition-all duration-200 ease-in-out opacity-0 
                      group-hover:opacity-100 shadow-lg"
          >
            <span className="text-white text-2xl font-bold">‹</span>
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center 
                      rounded-full bg-black/80 hover:bg-[#1DB954] transition-all duration-200 ease-in-out opacity-0 
                      group-hover:opacity-100 shadow-lg"
          >
            <span className="text-white text-2xl font-bold">›</span>
          </button>

          <div
            ref={ref}
            tabIndex={0}
            className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-1 focus:outline-none touch-pan-x"
          >
            {children}
          </div>

          {/* Edge fades - only on desktop */}
          <div className="hidden lg:block pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#121212] to-transparent" />
          <div className="hidden lg:block pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#121212] to-transparent" />
        </div>
      )}
    </section>
  );
};
