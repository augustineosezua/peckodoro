// Card.jsx
export const Card = ({ img, title, subtitle, meta, func, active = false }) => {
  // Normalize casing (Spotify capitalizes first letter)
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  return (
    <div
      onClick={func || (() => {})}
      className={`group relative w-44 p-3 rounded-md flex-shrink-0 cursor-pointer
                  bg-[#181818] hover:bg-[#282828] transition-colors duration-200
                  ${active ? "ring-2 ring-[#ffffff99]" : ""}`}
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="object-cover w-full h-full"
        />
        <button
          onClick={func}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-black fill-current">
            <path d="M5 3.867v16.266L19.5 12 5 3.867z" />
          </svg>
        </button>
      </div>

      {/* Fixed-height text block so cards line up */}
      <div className="mt-3 flex flex-col gap-[2px] h-[3.2rem]">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
          {cap(title)}
        </p>
        {subtitle && (
          <p className="text-xs text-[#b3b3b3] leading-tight line-clamp-1">
            {cap(subtitle)}
          </p>
        )}
        {meta && (
          <p className="text-[11px] text-[#7a7a7a] leading-tight line-clamp-1">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
};
