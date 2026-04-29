import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function HostModal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/*
        max-h + corps scrollable : le footer (boutons) reste visible même avec formulaire long + photos.
        min-h-0 sur la zone scrollable est requis pour que overflow-y-auto fonctionne en flexbox.
      */}
      <div className="my-auto flex w-full max-w-2xl max-h-[min(90vh,calc(100dvh-2rem))] flex-col rounded-card border border-line bg-white shadow-card">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            className="rounded-control px-3 py-2 text-sm font-semibold text-muted hover:bg-surface"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-line bg-white px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

