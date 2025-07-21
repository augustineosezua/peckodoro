export const Card = ({ img, title, subtitle, func, meta }) => (
  <div
    onClick={func || (() => {})}
    className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 w-44 flex-shrink-0 hover:bg-neutral-800 transition snap-start cursor-pointer flex flex-col items-start justify-between truncate"
  >
    <div className=" w-full aspect-square mb-2 rounded-lg overflow-hidden">
      <img src={img} alt={title} className="object-cover w-full h-full" />
    </div>
    <p className="text-sm font-medium truncate">{title}</p>
    {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
    {meta && <p className="text-[11px] text-neutral-500">{meta}</p>}
  </div>
);
