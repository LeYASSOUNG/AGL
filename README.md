# Quicklodge Platform

Plateforme d’hébergement : **API REST** (Spring Boot) + **frontend React** (`frontend/`, Vite sur le port **3000**, CORS déjà configuré côté API).

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Lancer l’application](#lancer-lapplication)
- [Build production](#build-production)
- [Déploiement (internet)](#déploiement-internet)
- [API & sécurité](#api--sécurité)
- [Structure du projet](#structure-du-projet)
- [Frontend](#frontend)
- [Données de test (profil dev)](#données-de-test-profil-dev)

## Fonctionnalités

- **Authentification** : inscription, connexion, refresh token, déconnexion (révocation du refresh token si fourni).
- **Établissements** : recherche paginée (ville, type, mot-clé), détail ; création / mise à jour pour les comptes autorisés.
- **Chambres** : liste par établissement (lecture publique) ; création / gestion via les routes **hôte**.
- **Réservations** : flux client / hôte / admin selon les rôles.
- **Paiements**, **notifications**, **avis** : modules dédiés (contrôleurs et services présents dans le code).
- **Administration** : liste des utilisateurs (activation / désactivation), établissements (ex. suspension), réservations.

Domaine modélisé côté persistance : utilisateurs, rôles, badges, établissements, chambres, disponibilités, réservations, paiements, notifications, avis, catalogue de services, etc.

## Stack technique

| Composant        | Détail |
|-----------------|--------|
| Runtime         | Java **17** |
| Framework       | **Spring Boot 3.2.5** (Web, Data JPA, Security, Validation) |
| Persistance     | **MySQL** (connecteur `mysql-connector-j`), **Hibernate** (`ddl-auto: update` par défaut) |
| Sécurité        | **JWT** (access + refresh, jjwt **0.11.5**), API stateless |
| Boilerplate     | **Lombok** |
| Build           | **Maven** (`pom.xml`) |

## Prérequis

- **JDK 17**
- **Maven 3.8+**
- **MySQL 8** (ou compatible) avec une base créée pour l’application (nom par défaut : `quicklodge_db`)

## Configuration

Les paramètres principaux sont dans `backend/src/main/resources/application.yml`. Vous pouvez les surcharger par **variables d’environnement** (recommandé en production) :

| Variable | Rôle |
|----------|------|
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE` | Connexion MySQL |
| `MYSQL_USER`, `MYSQL_PASSWORD` | Identifiants MySQL |
| `JWT_SECRET` | Clé de signature des JWT (taille suffisante pour HS256) |
| `JWT_ACCESS_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS` | Durées de vie des tokens |
| `JWT_ISSUER` | Émetteur des tokens |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées (séparées par virgule) |

> **Sécurité** : ne commitez pas de secrets réels. Utilisez des variables d’environnement ou un gestionnaire de secrets.

## Base de données

- **URL par défaut** : `jdbc:mysql://localhost:3306/quicklodge_db` (voir `application.yml`).
- **Schéma** : géré par Hibernate en `update` (pas de Flyway activé dans le `pom.xml` ; un fichier `data.sql` est utilisé en **profil dev** pour des inserts initiaux).

Créez la base avant le premier lancement :

```sql
CREATE DATABASE quicklodge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Lancer l’application

À la racine du dossier `backend` :

```bash
# Démarrage standard
mvn spring-boot:run

# Profil développement (SQL visible + exécution de data.sql)
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

- **Port** : `8080`
- **Context path** : `/api`  
- **URL de base** : `http://localhost:8080/api`

Classe principale : `com.quicklodge.QuicklodgeApplication`.

## Build production

### Frontend (Vite)

Dans `frontend/` :

```bash
npm install
npm run build
```

Le build est généré dans `frontend/dist/`.

#### Variable d’environnement API (prod)

Par défaut, le frontend appelle `"/api"` (proxy Vite en dev). En production, si l’API est sur un domaine/port différent, définir :

- `VITE_API_BASE_URL="https://api.example.com/api"`

Voir `frontend/.env.example`.

### Backend (Spring Boot)

Dans `backend/` :

```bash
mvn -DskipTests package
```

Le jar est généré dans `backend/target/`.

## Déploiement (internet)

Deux options recommandées.

### Option A — Frontend + Backend derrière un reverse proxy (Nginx)

- **Frontend** : servir `frontend/dist/` en statique.
- **Backend** : exposer `backend` sur `:8080` (ou interne) et proxyfier `/api` vers Spring Boot.

Exemple (à adapter) :

- **site**: `https://quicklodge.com`
- **api**: `https://quicklodge.com/api` (même domaine via proxy)

Dans ce cas, tu peux laisser `VITE_API_BASE_URL` vide (le front consomme `/api` sur le même host).

### Option B — Frontend et Backend sur domaines séparés

- **Frontend** : `https://app.quicklodge.com`
- **Backend** : `https://api.quicklodge.com/api`

Dans ce cas :

- Frontend : `VITE_API_BASE_URL="https://api.quicklodge.com/api"`
- Backend : `CORS_ALLOWED_ORIGINS="https://app.quicklodge.com"`

## API & sécurité

### Authentification

Les routes sous `/api/auth/**` sont **publiques** :

- `POST /api/auth/register` — inscription  
- `POST /api/auth/login` — connexion  
- `POST /api/auth/refresh` — nouveau access token  
- `POST /api/auth/logout` — déconnexion (corps optionnel avec refresh token)

Les autres routes protégées attendent un en-tête du type :

```http
Authorization: Bearer <access_token>
```

### Règles d’accès (résumé)

Définies dans `SecurityConfig` :

| Chemin / méthode | Accès |
|------------------|--------|
| `GET /etablissements/**`, `GET /avis/**` | Public |
| `/auth/**` | Public |
| `/reservations/**` | `CLIENT`, `HOST`, `ADMIN` |
| `/host/**` | `HOST`, `ADMIN` |
| `/admin/**` | `ADMIN` |
| Autres requêtes authentifiées | Utilisateur connecté |

### CORS

Par défaut : **`http://localhost:3000`**.

Pour la prod, définir `CORS_ALLOWED_ORIGINS` (liste séparée par virgules), par exemple :

```bash
CORS_ALLOWED_ORIGINS="https://quicklodge.com,https://www.quicklodge.com"
```

### Contrôleurs (préfixe `/api`)

| Préfixe | Rôle |
|---------|------|
| `/auth` | Authentification |
| `/etablissements`, `/etablissements/{id}/chambres`, … | Catalogue / détail |
| `/host/...` | Espace hôte (ex. chambres, réservations hôte) |
| `/admin/...` | Administration |
| `/users`, `/reservations`, `/paiements`, `/notifications`, `/avis` | Selon les règles ci-dessus |

## Structure du projet

```
Quickloge platform/
├── frontend/          # React + Vite + Tailwind (port 3000)
└── backend/
    ├── pom.xml
    └── src/main/
        ├── java/com/quicklodge/
        │   ├── QuicklodgeApplication.java
        │   ├── config/           # Sécurité, beans applicatifs
        │   ├── controller/       # API REST
        │   ├── dto/              # Requêtes / réponses
        │   ├── entity/           # Entités JPA
        │   ├── exception/        # Erreurs + @ControllerAdvice
        │   ├── mapper/           # Mappers entité ↔ DTO
        │   ├── repository/       # Spring Data JPA
        │   ├── security/         # JWT, filtres, UserDetails
        │   ├── service/          # Logique métier
        │   └── util/             # JWT, constantes, sécurité
        └── resources/
            ├── application.yml
            ├── application-dev.yml
            └── db/migration/data.sql   # Données init (profil dev)
```

## Frontend

Voir **[frontend/README.md](frontend/README.md)** : `npm install` puis `npm run dev` dans `frontend/`. Parcours proche des maquettes (réservation en plusieurs étapes, dashboard hôte avec graphiques, profil, paiement simulé).

## Données de test (`data.sql`)

Au démarrage, après la mise à jour du schéma JPA, le fichier `data.sql` est exécuté automatiquement (`spring.sql.init` + `defer-datasource-initialization` dans `application.yml`). Le profil **`dev`** active en plus les logs SQL détaillés (`application-dev.yml`).

Le script insère notamment :

- Les rôles : `ROLE_CLIENT`, `ROLE_HOST`, `ROLE_ADMIN`
- Un compte administrateur de test :
  - **Email** : `admin@quicklodge.com`  
  - **Mot de passe** : `password`  
- Des badges d’exemple (`SUPER_HOST`, `VERIFIED`, etc.)

---

*Projet : **quicklodge-platform** · version **1.0.0-SNAPSHOT** (voir `backend/pom.xml`).*
