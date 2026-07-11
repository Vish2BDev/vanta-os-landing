export function Nav() {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex items-center justify-between transition-opacity duration-500 ease-out md:inset-x-6 md:top-5">
      <a href="#top" className="pointer-events-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/vanta-logo.png"
          alt="Vanta"
          className="h-4 w-auto opacity-90 transition-opacity hover:opacity-100 md:h-5"
        />
      </a>
      <a
        href="#waitlist"
        className="group pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-4 py-2 font-aeonik text-[12px] font-medium tracking-[0.01em] text-white/90 backdrop-blur-md transition-colors duration-200 hover:border-white/30 hover:bg-black/60"
      >
        Join the waitlist
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </a>
    </div>
  );
}
