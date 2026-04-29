# QuickLodge — frontend

Interface **React + Vite + TypeScript + Tailwind**, alignée sur les maquettes (accueil, fiche établissement, parcours réservation, paiement, profil, espace hôte, admin minimal).

## Prérequis

- Node.js 18+ et npm

## Commandes

```bash
cd frontend
npm install
npm run dev
```

L’app tourne sur **http://localhost:3000** (CORS du backend Spring déjà prévu pour ce port).

Build production :

```bash
npm run build
npm run preview
```

## Proxy API

`vite.config.ts` proxifie `/api` vers `http://localhost:8080` : en dev, les futurs appels `fetch('/api/...')` atteindront le backend sans CORS supplémentaire.

## Parcours implémentés (données mock + état local)

| Suite | Routes |
|--------|--------|
| Auth | `/connexion`, `/inscription` (session démo `localStorage`, à brancher sur `POST /api/auth/*`) |
| Catalogue | `/`, `/etablissement/:id` |
| Réservation | `/reservation` → `/reservation/services` → `/paiement` → `/reservation/confirmee` → `/reservation/fin` |
| Client | `/profil`, `/profil?tab=reservations` |
| Hôte | `/host` (dashboard), `/host/hebergements`, `/host/chambres`, `/host/services`, `/host/reservations`, `/host/avis` |
| Admin | `/admin` (stats factices) ; depuis la page connexion, « Accès administrateur » remplit une session admin |

Les **images** des cartes utilisent Unsplash ; tu peux remplacer par tes exports Figma dans `public/`.

## Arborescence `src/pages/`

- `admin/` — `AdminDashboardPage.tsx`
- `auth/` — `LoginPage.tsx`, `RegisterPage.tsx`
- `client/` — `HomePage`, `HotelDetailPage`, `BookingPage`, `BookingServicesPage`, `PaymentPage`, `BookingConfirmationPage`, `BookingThankYouPage`, `ProfilePage`
- `host/` — `HostShell.tsx`, `HostDashboardPage`, `HostHebergementsPage`, `HostChambresPage`, `HostServicesPage`, `HostReservationsPage`, `HostAvisPage`

## Prochaines étapes backend

- Remplacer `src/data/mockData.ts` par des appels à `/api/etablissements`, etc.
- Auth : envoyer `email` + `motDePasse` comme attendu par le backend.
- Stocker `accessToken` / `refreshToken` et intercepter les 401 pour `/api/auth/refresh`.
