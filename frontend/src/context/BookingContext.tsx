import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** price = montant pour une unité (quantité 1), déjà multiplié par nuitées si l’unité est « nuit ». */
export type BookingServiceLine = { id: string; title: string; price: number; quantity: number };

export type BookingDraft = {
  hotelId: string;
  hotelName: string;
  ville: string;
  roomId: string;
  roomName: string;
  roomDescription: string;
  capacity: number;
  pricePerNight: number;
  /** Image principale (chambre ou établissement) pour le récapitulatif réservation. */
  coverUrl: string;
  dateArrivee: string;
  dateDepart: string;
  guests: number;
  services: BookingServiceLine[];
  paymentMethod: 'mobile' | 'card';
  reservationRef: string | null;
};

const empty: BookingDraft = {
  hotelId: '',
  hotelName: '',
  ville: '',
  roomId: '',
  roomName: '',
  roomDescription: '',
  capacity: 2,
  pricePerNight: 0,
  coverUrl: '',
  dateArrivee: '',
  dateDepart: '',
  guests: 2,
  services: [],
  paymentMethod: 'mobile',
  reservationRef: null,
};

type Ctx = {
  draft: BookingDraft;
  setDraft: (p: Partial<BookingDraft>) => void;
  reset: () => void;
  nights: number;
  guests: number;
  roomSubtotal: number;
  servicesTotal: number;
  total: number;
};

const BookingContext = createContext<Ctx | null>(null);

function parseISODate(s: string): number {
  if (!s) return NaN;
  return new Date(s + 'T12:00:00').getTime();
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setState] = useState<BookingDraft>(empty);

  const setDraft = useCallback((p: Partial<BookingDraft>) => {
    setState((prev) => ({ ...prev, ...p }));
  }, []);

  const reset = useCallback(() => setState(empty), []);

  const nights = useMemo(() => {
    const a = parseISODate(draft.dateArrivee);
    const b = parseISODate(draft.dateDepart);
    if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 1;
    return Math.max(1, Math.round((b - a) / 86400000));
  }, [draft.dateArrivee, draft.dateDepart]);

  const roomSubtotal = draft.pricePerNight * nights;
  const servicesTotal = draft.services.reduce(
    (s, x) => s + x.price * Math.max(1, Math.min(99, Math.floor(x.quantity) || 1)),
    0
  );
  const total = roomSubtotal + servicesTotal;

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      reset,
      nights,
      guests: draft.guests,
      roomSubtotal,
      servicesTotal,
      total,
    }),
    [draft, setDraft, reset, nights, roomSubtotal, servicesTotal, total]
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking outside BookingProvider');
  return ctx;
}
