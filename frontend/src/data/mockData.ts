/** Données de démo alignées sur les maquettes — à remplacer par l’API `/api`. */

export type MockRoom = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  image: string;
};

export type MockHotel = {
  id: string;
  name: string;
  description: string;
  address: string;
  ville: string;
  rating: number;
  reviewCount: number;
  qualityBadge?: boolean;
  fromPrice: number;
  cover: string;
  gallery: string[];
  amenities: { icon: string; label: string }[];
  rooms: MockRoom[];
};

export const MOCK_HOTELS: MockHotel[] = [
  {
    id: '1',
    name: 'Hôtel Luxe Palace',
    description:
      'Un hôtel 5 étoiles au cœur de la ville avec des services premium et un spa de luxe.',
    address: '123 Avenue de la République',
    ville: 'Abidjan',
    rating: 4.8,
    reviewCount: 245,
    qualityBadge: true,
    fromPrice: 150_000,
    cover:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e54d34?w=800&q=80',
    ],
    amenities: [
      { icon: 'wifi', label: 'WiFi' },
      { icon: 'utensils', label: 'Restaurant' },
      { icon: 'waves', label: 'Piscine' },
      { icon: 'car', label: 'Parking' },
      { icon: 'sparkles', label: 'Spa' },
    ],
    rooms: [
      {
        id: 'r1',
        name: 'Suite Présidentielle',
        description: 'Suite luxueuse avec vue panoramique',
        capacity: 3,
        pricePerNight: 250_000,
        image:
          'https://images.unsplash.com/photo-1611892440504-42a792e54d34?w=600&q=80',
      },
    ],
  },
  {
    id: '2',
    name: 'Résidence Confort',
    description:
      'Résidence moderne avec des appartements spacieux, idéale pour les familles.',
    address: 'Cocody, Abidjan',
    ville: 'Abidjan',
    rating: 4.2,
    reviewCount: 89,
    fromPrice: 45_000,
    cover:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    ],
    amenities: [
      { icon: 'wifi', label: 'WiFi' },
      { icon: 'car', label: 'Parking' },
    ],
    rooms: [
      {
        id: 'r2',
        name: 'Appartement 2 Pièces',
        description: 'Espace familial lumineux',
        capacity: 4,
        pricePerNight: 45_000,
        image:
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      },
    ],
  },
  {
    id: '3',
    name: 'Villa Océane',
    description:
      'Villa en bord de mer avec vue imprenable sur l’océan, parfaite pour des vacances relaxantes.',
    address: 'Front de mer',
    ville: 'Grand-Bassam',
    rating: 4.6,
    reviewCount: 156,
    qualityBadge: true,
    fromPrice: 95_000,
    cover:
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
    ],
    amenities: [
      { icon: 'wifi', label: 'WiFi' },
      { icon: 'waves', label: 'Plage' },
    ],
    rooms: [
      {
        id: 'r3',
        name: 'Villa entière',
        description: 'Vue océan, jardin privé',
        capacity: 8,
        pricePerNight: 95_000,
        image:
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
      },
    ],
  },
];

export const EXTRA_SERVICES = [
  {
    id: 's1',
    title: 'Petit-déjeuner',
    description: 'Buffet petit-déjeuner continental',
    price: 5_000,
  },
  {
    id: 's2',
    title: 'Massage Spa',
    description: 'Séance de massage relaxant 1h',
    price: 25_000,
  },
  {
    id: 's3',
    title: 'Navette Aéroport',
    description: 'Transport aller-retour aéroport',
    price: 15_000,
  },
] as const;

export function getHotel(id: string): MockHotel | undefined {
  return MOCK_HOTELS.find((h) => h.id === id);
}
