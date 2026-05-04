type GlowToggleProps = {
  on: boolean;
  disabled?: boolean;
  pending?: boolean;
  onToggle: () => void;
};

export function GlowToggle({ on, disabled, pending, onToggle }: GlowToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled || pending}
      onClick={() => !disabled && onToggle()}
      className={[
        'relative inline-flex h-9 w-[60px] items-center rounded-full border transition-all duration-200',
        on
          ? 'border-[#00ff66]/70 bg-[#00ff66]/14 shadow-[0_0_24px_rgba(0,255,102,.25)]'
          : 'border-neutral-700 bg-neutral-950',
        disabled || pending
          ? 'cursor-not-allowed opacity-55'
          : 'cursor-pointer hover:brightness-110',
      ].join(' ')}
    >
      <span className="sr-only">Toggle device power</span>
      <span
        className={[
          'inline-block h-[30px] w-[30px] transform rounded-full border border-white/40 bg-gradient-to-br from-neutral-900 to-black transition-all duration-200',
          on ? 'translate-x-7 shadow-[0_0_22px_rgba(0,255,102,.5)] border-[#00ff66]' : 'translate-x-[3px]',
        ].join(' ')}
      />
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.35em] text-neutral-600">
          ···
        </span>
      ) : null}
    </button>
  );
}
