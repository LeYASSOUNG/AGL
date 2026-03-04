#  Plateforme de Réservation d'Hébergements Touristiques

Application web de réservation d'hébergements touristiques en Côte d'Ivoire.

##  Description

Plateforme complète permettant :
-  **Aux voyageurs** : Rechercher, comparer et réserver des hébergements
-  **Aux hôtes** : Gérer leurs établissements et réservations
-  **Aux admins** : Superviser et valider les établissements

##  Technologies Utilisées

### Backend
-  **Java 17**
-  **Spring Boot 3.2**
-  **Spring Security** (JWT)
-  **MySQL 8.0**
-  **Maven**

### Frontend
-  **Next.js 14**
-  **React 18**
-  **TypeScript**
-  **Tailwind CSS**

##  Installation et Lancement

### Prérequis
- Java 17+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+

### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Serveur : http://localhost:8080

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Application : http://localhost:3000

### Base de données
```sql
CREATE DATABASE reservation_touristique;
```
##  Planning du Projet

- **Phase 1** : Analyse & Conception (3 semaines) - 01/03 au 21/03
- **Phase 2** : Développement Backend MVP (4 semaines) - 22/03 au 18/04
- **Phase 3** : Développement Frontend MVP (4 semaines) - 19/04 au 16/05
- **Phase 4** : Dashboards & Interfaces (3 semaines) - 17/05 au 06/06
- **Phase 5** : Fonctionnalités Avancées (3 semaines) - 07/06 au 27/06
- **Phase 6** : Tests & Optimisation (2 semaines) - 28/06 au 11/07
- **Phase 7** : Déploiement Production (1 semaine) - 12/07 au 18/07

## 📊 Fonctionnalités Principales

### Pour les Clients
- ✅ Recherche d'établissements par ville, dates, budget
- ✅ Comparaison des hébergements (prix, avis, badges)
- ✅ Réservation en ligne avec services additionnels
- ✅ Paiement sécurisé (Mobile Money, Carte bancaire)
- ✅ Notation et avis après séjour

### Pour les Hôtes
- ✅ Gestion des établissements et chambres
- ✅ Configuration des services et tarifs
- ✅ Suivi des réservations en temps réel
- ✅ Statistiques de performance
- ✅ Badges de qualité automatiques

### Pour les Admins
- ✅ Validation des établissements
- ✅ Modération des avis
- ✅ Statistiques globales
- ✅ Gestion des utilisateurs

##  Contact

**Repository** : https://github.com/SINTIA306/projet-GenieLogiciel

