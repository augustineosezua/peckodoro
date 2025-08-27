// Card.jsx
export const Card = ({ img, title, subtitle, meta, func, active = false }) => {
  // Normalize casing (Spotify capitalizes first letter)
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  return (
    <div
      onClick={func || (() => {})}
      className={`group relative w-40 lg:w-44 p-3 lg:p-4 rounded-xl flex-shrink-0 cursor-pointer
                  bg-[#181818] hover:bg-[#282828] active:bg-[#282828] transition-all duration-200
                  shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
                  ${active ? "ring-2 ring-[#1db954]" : ""}`}
    >
      <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <button
          onClick={func}
          className="absolute bottom-2 right-2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center shadow-lg
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 
                     transform hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 lg:w-5 lg:h-5 text-black fill-current ml-0.5">
            <path d="M5 3.867v16.266L19.5 12 5 3.867z" />
          </svg>
        </button>
      </div>

      {/* Fixed-height text block so cards line up */}
      <div className="mt-3 flex flex-col gap-1 h-[3.5rem] lg:h-[3.2rem]">
        <p className="text-sm lg:text-base font-semibold text-white leading-tight line-clamp-2 lg:line-clamp-1 group-hover:text-[#1db954] transition-colors">
          {cap(title)}
        </p>
        {subtitle && (
          <p className="text-xs lg:text-sm text-[#b3b3b3] leading-tight line-clamp-1 group-hover:text-[#d9d9d9] transition-colors">
            {cap(subtitle)}
          </p>
        )}
        {meta && (
          <p className="text-[11px] lg:text-xs text-[#7a7a7a] leading-tight line-clamp-1">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
};
