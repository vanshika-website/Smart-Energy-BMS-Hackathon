export function Breadcrumbs({ trail }: { trail: string[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-4 text-[13px] text-neutral-500"
    >
      {trail.map((crumb, i) => (
        <span key={`${crumb}-${i}`} className="flex items-center gap-2">
          {i > 0 ? (
            <span className="text-neutral-700" aria-hidden>
              ›
            </span>
          ) : null}
          <span className={i === trail.length - 1 ? 'font-medium text-neutral-300' : undefined}>
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}
