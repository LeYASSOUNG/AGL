export function HostStepper({
  steps,
  current,
}: {
  steps: number;
  current: number; // 1-based
}) {
  const clamped = Math.max(1, Math.min(steps, current));
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: steps }).map((_, idx) => {
        const step = idx + 1;
        const done = step < clamped;
        const active = step === clamped;

        return (
          <div key={step} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold',
                  done
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white text-muted',
                ].join(' ')}
              >
                {step}
              </div>
            </div>
            {step < steps ? (
              <div className="h-0.5 w-10 bg-line" style={{ position: 'relative' }}>
                {done ? (
                  <div className="absolute left-0 top-0 h-0.5 w-10 bg-emerald-500" />
                ) : active && step === clamped - 1 ? (
                  <div className="absolute left-0 top-0 h-0.5 w-10 bg-ink" />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

