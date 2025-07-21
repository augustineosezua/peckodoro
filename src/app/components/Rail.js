export const Rail = ({ title, children, empty }) => (
  <section>
    <h2 className="text-lg font-semibold mb-3 px-1">{title}</h2>
    {empty ? (
      <p className="text-sm text-neutral-400 px-1">
        No {title.toLowerCase()} found
      </p>
    ) : (
      <div
        className="
          flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700
          pb-3 scroll-px-4 snap-x snap-mandatory
        "
      >
        {children}
      </div>
    )}
  </section>
);
