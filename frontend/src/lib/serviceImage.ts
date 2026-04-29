import type { BackendPublicService, BackendService } from './backendApi';

type MinimalService = {
  libelle: string;
  categorie?: string | null;
  imageUrl?: string | null;
};

function normalizeText(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Retourne l'image d'un service.
 * - si une image est fournie par l'API (upload), on la préfère
 * - sinon, on renvoie un fallback cohérent basé sur le nom/catégorie
 */
export function serviceImageUrl(s: MinimalService): string {
  if (s.imageUrl) return s.imageUrl;

  const name = normalizeText(s.libelle);
  const cat = normalizeText(String(s.categorie ?? ''));
  const text = `${name} ${cat}`;

  const picks: Array<[RegExp, string]> = [
    [/wifi|internet/, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80'],
    [/petit dejeuner|petit-dejeuner|breakfast/, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80'],
    [/restaurant|repas|cuisine|dejeuner|diner|buffet/, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80'],
    [/spa|massage|bien[- ]?etre|wellness/, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80'],
    [/piscine|pool/, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80'],
    [/salle de sport|gym|fitness/, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80'],
    [/parking|garage/, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&q=80'],
    [/navette|transfert|transport|taxi|chauffeur/, 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200&q=80'],
    [/menage|nettoyage|cleaning/, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80'],
    [/blanchisserie|lessive|laundry/, 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=1200&q=80'],
    [/clim|climatisation|air condition/, 'https://images.unsplash.com/photo-1551887373-6a3e4f1f5f8e?w=1200&q=80'],
    [/bar|cocktail/, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80'],
    [/excursion|tour|visite|activite/, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80'],
  ];

  for (const [re, url] of picks) {
    if (re.test(text)) return url;
  }

  return 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80';
}

// Convenience type guards for existing app types (not used at runtime, but helpful for callers)
export type { BackendPublicService, BackendService };

