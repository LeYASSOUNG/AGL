-- Rôles initiaux (INSERT IGNORE pour éviter doublon si re-run)
INSERT IGNORE INTO roles (name, created_at, updated_at)
VALUES ('ROLE_CLIENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('ROLE_HOST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('ROLE_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User admin de test (mot de passe : password)
-- BCrypt hash pour "password" (aligné sur BCryptPasswordEncoder strength 12 côté Java)
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, enabled, created_at, updated_at)
VALUES ('admin@quicklodge.com',
        '$2a$12$1tBEcIxPPxwm08KtZKnpruSdzTP7vpvRA.zCFgpQgJYZj.MZiPvN2',
        'Admin',
        'Platform',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

-- Si l’admin existait déjà (INSERT IGNORE ignoré), corrige quand même le hash (ancien data.sql était invalide pour « password »).
UPDATE users
SET password_hash = '$2a$12$1tBEcIxPPxwm08KtZKnpruSdzTP7vpvRA.zCFgpQgJYZj.MZiPvN2'
WHERE email = 'admin@quicklodge.com';

-- Lier l'admin au rôle ROLE_ADMIN
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@quicklodge.com'
  AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- Types d'établissement (admin configurables)
INSERT IGNORE INTO type_etablissement (libelle, description, actif, created_at) VALUES
('Hôtel', 'Établissement hôtelier classique', true, CURRENT_TIMESTAMP),
('Appartement', 'Logement indépendant', true, CURRENT_TIMESTAMP),
('Maison', 'Maison entière', true, CURRENT_TIMESTAMP),
('Villa', 'Villa avec équipements haut de gamme', true, CURRENT_TIMESTAMP),
('Auberge', 'Auberge de jeunesse', true, CURRENT_TIMESTAMP),
('Résidence', 'Résidence de tourisme', true, CURRENT_TIMESTAMP);

-- Types de chambre de base (admin / style Booking.com)
INSERT IGNORE INTO type_chambre (libelle, description, actif, created_at) VALUES
('Chambre Simple', 'Chambre pour une personne', true, CURRENT_TIMESTAMP),
('Chambre Double', 'Chambre pour deux personnes', true, CURRENT_TIMESTAMP),
('Chambre Triple', 'Chambre pour trois personnes ou plus', true, CURRENT_TIMESTAMP),
('Suite', 'Suite avec espace salon ou équipements premium', true, CURRENT_TIMESTAMP),
('Chambre Familiale', 'Grande chambre ou espace adapté aux familles', true, CURRENT_TIMESTAMP),
('Chambre Deluxe', 'Chambre haut de gamme, confort renforcé', true, CURRENT_TIMESTAMP);

-- Réparer les "zero dates" (sinon MySQL Connector/J lève: Zero date value prohibited)
-- On évite le littéral '0000-00-00...' car certains sql_mode MySQL le rejettent.
UPDATE type_etablissement SET created_at = CURRENT_TIMESTAMP WHERE created_at < '1970-01-01 00:00:00';
UPDATE type_chambre       SET created_at = CURRENT_TIMESTAMP WHERE created_at < '1970-01-01 00:00:00';

-- Réparation données legacy après migration enum -> entité
-- Si des IDs 0/NULL (ou invalide) existent, on les bascule vers le premier type actif.
UPDATE etablissements
SET type_etablissement_id = (SELECT id FROM type_etablissement WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_etablissement_id IS NULL OR type_etablissement_id = 0;

UPDATE etablissements
SET type_etablissement_id = (SELECT id FROM type_etablissement WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_etablissement_id IS NOT NULL
  AND type_etablissement_id <> 0
  AND type_etablissement_id NOT IN (SELECT id FROM type_etablissement);

UPDATE chambres
SET type_chambre_id = (SELECT id FROM type_chambre WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_chambre_id IS NULL OR type_chambre_id = 0;

UPDATE chambres
SET type_chambre_id = (SELECT id FROM type_chambre WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_chambre_id IS NOT NULL
  AND type_chambre_id <> 0
  AND type_chambre_id NOT IN (SELECT id FROM type_chambre);

-- Nom personnalisé (colonne ajoutée par Hibernate en ddl-auto:update) : recopie depuis nom si vide
UPDATE chambres
SET nom_personnalise = nom
WHERE nom_personnalise IS NULL OR TRIM(nom_personnalise) = '';

-- Types de badge (admin configurables)
INSERT IGNORE INTO type_badge (libelle, description, actif, created_at) VALUES
('Super Hôte', 'Hôte avec excellentes évaluations', true, CURRENT_TIMESTAMP),
('Vérifié', 'Profil vérifié par la plateforme', true, CURRENT_TIMESTAMP),
('Premium', 'Membre premium', true, CURRENT_TIMESTAMP),
('Nouveau', 'Nouveau membre', true, CURRENT_TIMESTAMP),
('Client fidèle', 'Au moins cinq séjours terminés en tant que client', true, CURRENT_TIMESTAMP),
('Top Hôte', 'Note moyenne des avis sur les établissements de l’hôte ≥ 4,8', true, CURRENT_TIMESTAMP);

-- Types de notification (admin configurables)
INSERT IGNORE INTO type_notification (libelle, description, actif, created_at) VALUES
('Réservation', 'Notification liée à une réservation', true, CURRENT_TIMESTAMP),
('Paiement', 'Notification liée à un paiement', true, CURRENT_TIMESTAMP),
('Avis', 'Notification liée à un avis', true, CURRENT_TIMESTAMP),
('Message', 'Notification liée à un message', true, CURRENT_TIMESTAMP),
('Système', 'Notification système de la plateforme', true, CURRENT_TIMESTAMP);

UPDATE type_badge        SET created_at = CURRENT_TIMESTAMP WHERE created_at < '1970-01-01 00:00:00';
UPDATE type_notification SET created_at = CURRENT_TIMESTAMP WHERE created_at < '1970-01-01 00:00:00';

-- Badges de test (liés aux types configurables)
INSERT IGNORE INTO badges (type_badge_id, libelle, created_at, updated_at)
VALUES
((SELECT id FROM type_badge WHERE libelle = 'Super Hôte' LIMIT 1), 'Super Hôte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM type_badge WHERE libelle = 'Vérifié' LIMIT 1), 'Profil vérifié', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM type_badge WHERE libelle = 'Premium' LIMIT 1), 'Premium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM type_badge WHERE libelle = 'Nouveau' LIMIT 1), 'Nouveau', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM type_badge WHERE libelle = 'Client fidèle' LIMIT 1), 'Client fidèle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM type_badge WHERE libelle = 'Top Hôte' LIMIT 1), 'Top Hôte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Réparation données legacy après migration enum -> entité
UPDATE badges
SET type_badge_id = (SELECT id FROM type_badge
                     WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_badge_id IS NULL OR type_badge_id = 0;

UPDATE badges
SET type_badge_id = (SELECT id FROM type_badge WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_badge_id IS NOT NULL
  AND type_badge_id <> 0
  AND type_badge_id NOT IN (SELECT id FROM type_badge);

UPDATE notifications
SET type_notification_id = (SELECT id FROM type_notification
                            WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_notification_id IS NULL OR type_notification_id = 0;

UPDATE notifications
SET type_notification_id = (SELECT id FROM type_notification WHERE actif = true ORDER BY id LIMIT 1)
WHERE type_notification_id IS NOT NULL
  AND type_notification_id <> 0
  AND type_notification_id NOT IN (SELECT id FROM type_notification);

-- Hébergements : rattrapage migration « valide_admin » (sinon ils ne sortent plus sur l’accueil).
-- Avec spring.sql.init.mode=always cette ligne tourne à chaque démarrage (tout repasse validé, y compris les brouillons).
UPDATE etablissements SET valide_admin = true;
