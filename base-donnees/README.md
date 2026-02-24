# 📊 Base de Données

Ce dossier contient les scripts SQL et fichiers liés à la base de données.

## 📁 Structure
```
base-donnees/
├── init.sql              # Script d'initialisation
├── migrations/           # Scripts de migration
├── seeds/                # Données de test
└── backups/              # Sauvegardes (ignoré par Git)
```

## 🗄️ Base de données : `reservation_touristique`

### Tables principales
- `users` - Utilisateurs
- `etablissements` - Hébergements
- `chambres` - Chambres
- `services` - Services proposés
- `reservations` - Réservations
- `service_reservations` - Services réservés
- `paiements` - Paiements
- `avis` - Évaluations

## 🚀 Initialisation
```sql
CREATE DATABASE reservation_touristique 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE reservation_touristique;
```

## 📝 Notes

Les tables seront créées automatiquement par Hibernate (Spring Boot) au premier lancement.