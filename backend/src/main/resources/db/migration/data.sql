-- Seed minimal et idempotent.
-- But: garantir un démarrage stable sans injecter de données métier lourdes.

-- Rôles de base
INSERT IGNORE INTO roles (name, created_at, updated_at)
VALUES
  ('ROLE_CLIENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ROLE_HOST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ROLE_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Compte admin de test (mot de passe: password)
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, enabled, created_at, updated_at)
VALUES (
  'admin@quicklodge.com',
  '$2a$12$1tBEcIxPPxwm08KtZKnpruSdzTP7vpvRA.zCFgpQgJYZj.MZiPvN2',
  'Admin',
  'Platform',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Ré-assure le hash admin si l'utilisateur existe déjà
UPDATE users
SET password_hash = '$2a$12$1tBEcIxPPxwm08KtZKnpruSdzTP7vpvRA.zCFgpQgJYZj.MZiPvN2'
WHERE email = 'admin@quicklodge.com';

-- Lien admin -> ROLE_ADMIN
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'ROLE_ADMIN'
WHERE u.email = 'admin@quicklodge.com';

-- Référentiels de types
INSERT IGNORE INTO type_etablissement (libelle, description, actif, created_at)
VALUES
  ('Hôtel', 'Établissement hôtelier classique', true, CURRENT_TIMESTAMP),
  ('Appartement', 'Logement indépendant', true, CURRENT_TIMESTAMP),
  ('Maison', 'Maison entière', true, CURRENT_TIMESTAMP),
  ('Villa', 'Villa avec équipements haut de gamme', true, CURRENT_TIMESTAMP),
  ('Auberge', 'Auberge de jeunesse', true, CURRENT_TIMESTAMP),
  ('Résidence', 'Résidence de tourisme', true, CURRENT_TIMESTAMP);

INSERT IGNORE INTO type_chambre (libelle, description, actif, created_at)
VALUES
  ('Chambre Simple', 'Chambre pour une personne', true, CURRENT_TIMESTAMP),
  ('Chambre Double', 'Chambre pour deux personnes', true, CURRENT_TIMESTAMP),
  ('Chambre Triple', 'Chambre pour trois personnes ou plus', true, CURRENT_TIMESTAMP),
  ('Suite', 'Suite avec espace salon ou équipements premium', true, CURRENT_TIMESTAMP),
  ('Chambre Familiale', 'Grande chambre ou espace adapté aux familles', true, CURRENT_TIMESTAMP),
  ('Chambre Deluxe', 'Chambre haut de gamme, confort renforcé', true, CURRENT_TIMESTAMP);

INSERT IGNORE INTO type_badge (libelle, description, actif, created_at)
VALUES
  ('Super Hôte', 'Hôte avec excellentes évaluations', true, CURRENT_TIMESTAMP),
  ('Vérifié', 'Profil vérifié par la plateforme', true, CURRENT_TIMESTAMP),
  ('Premium', 'Membre premium', true, CURRENT_TIMESTAMP),
  ('Nouveau', 'Nouveau membre', true, CURRENT_TIMESTAMP),
  ('Client fidèle', 'Au moins cinq séjours terminés en tant que client', true, CURRENT_TIMESTAMP),
  ('Top Hôte', 'Note moyenne des avis sur les établissements de l’hôte >= 4,8', true, CURRENT_TIMESTAMP);

INSERT IGNORE INTO type_notification (libelle, description, actif, created_at)
VALUES
  ('Réservation', 'Notification liée à une réservation', true, CURRENT_TIMESTAMP),
  ('Paiement', 'Notification liée à un paiement', true, CURRENT_TIMESTAMP),
  ('Avis', 'Notification liée à un avis', true, CURRENT_TIMESTAMP),
  ('Message', 'Notification liée à un message', true, CURRENT_TIMESTAMP),
  ('Système', 'Notification système de la plateforme', true, CURRENT_TIMESTAMP);
