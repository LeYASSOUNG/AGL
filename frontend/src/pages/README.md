# Pages par domaine

| Dossier    | Rôle |
|-----------|------|
| `admin/`  | Administration plateforme (`AdminDashboardPage`) |
| `auth/`   | Connexion, inscription |
| `client/` | Site voyageur : accueil, fiche établissement, réservation, paiement, profil |
| `host/`   | Espace hôte : layout `HostShell` + dashboard, hébergements, chambres, services, réservations, avis |

Les routes sont déclarées dans `src/App.tsx`. Chaque écran a son propre fichier composant.
