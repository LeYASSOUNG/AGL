package com.quicklodge.service;

import com.quicklodge.entity.Badge;
import com.quicklodge.entity.StatutReservation;
import com.quicklodge.entity.TypeBadge;
import com.quicklodge.entity.User;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.AvisRepository;
import com.quicklodge.repository.BadgeRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.repository.TypeBadgeRepository;
import com.quicklodge.repository.UserRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Attribution automatique des badges métier (types configurés en base {@link TypeBadge}).
 * Les lignes {@link Badge} référencent un type ; les utilisateurs y sont liés via {@link User#getBadges()}.
 */
@Service
@RequiredArgsConstructor
public class BadgeService {

    public static final String TYPE_LIBELLE_CLIENT_FIDELE = "Client fidèle";
    public static final String TYPE_LIBELLE_TOP_HOTE = "Top Hôte";

    private static final int SEUIL_RESERVATIONS_CLIENT_FIDELE = 5;
    private static final double SEUIL_NOTE_MOYENNE_TOP_HOTE = 4.8;

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final TypeBadgeRepository typeBadgeRepository;
    private final ReservationRepository reservationRepository;
    private final AvisRepository avisRepository;

    /**
     * Recalcule les badges automatiques puis retourne la liste affichable (triée par libellé de type).
     */
    @Transactional
    public List<UserBadgeItem> listBadgesWithAutomaticRules(Long userId) {
        synchronizeAutomaticBadges(userId);
        User user = userRepository.findByIdWithBadges(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        List<Badge> list = new ArrayList<>(user.getBadges());
        list.sort(Comparator.comparing(b -> b.getType().getLibelle(), String.CASE_INSENSITIVE_ORDER));
        return list.stream().map(this::toItem).toList();
    }

    /**
     * Règles : « Client fidèle » si au moins 5 réservations terminées en tant que client ;
     * « Top Hôte » si l’utilisateur est hôte et la moyenne des notes sur ses établissements est ≥ 4,8.
     */
    @Transactional
    public void synchronizeAutomaticBadges(Long userId) {
        User user = userRepository.findByIdWithBadges(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        long reservationsTerminees = reservationRepository.countByClient_IdAndStatut(userId, StatutReservation.TERMINEE);
        boolean clientFidele = reservationsTerminees >= SEUIL_RESERVATIONS_CLIENT_FIDELE;
        applyAutomaticBadge(user, TYPE_LIBELLE_CLIENT_FIDELE, clientFidele);

        boolean topHote = false;
        if (user.isHost()) {
            Double moyenne = avisRepository.averageNoteForHost(userId);
            topHote = moyenne != null && Double.compare(moyenne, SEUIL_NOTE_MOYENNE_TOP_HOTE) >= 0;
        }
        applyAutomaticBadge(user, TYPE_LIBELLE_TOP_HOTE, topHote);

        userRepository.save(user);
    }

    private void applyAutomaticBadge(User user, String typeLibelle, boolean shouldHave) {
        Optional<Badge> badgeOpt = resolveCatalogBadge(typeLibelle);
        if (badgeOpt.isEmpty()) {
            return;
        }
        Badge badge = badgeOpt.get();
        boolean has = user.getBadges().contains(badge);
        if (shouldHave && !has) {
            user.addBadge(badge);
        } else if (!shouldHave && has) {
            user.removeBadge(badge);
        }
    }

    /** Résout ou crée la ligne {@link Badge} catalogue pour un type actif (une ligne par type). */
    private Optional<Badge> resolveCatalogBadge(String typeLibelle) {
        Optional<TypeBadge> typeOpt = typeBadgeRepository.findByLibelleIgnoreCase(typeLibelle)
                .filter(t -> Boolean.TRUE.equals(t.getActif()));
        if (typeOpt.isEmpty()) {
            return Optional.empty();
        }
        TypeBadge type = typeOpt.get();
        return Optional.of(badgeRepository
                .findFirstByType_LibelleIgnoreCaseAndType_ActifTrue(type.getLibelle())
                .orElseGet(() -> badgeRepository.save(
                        Badge.builder().type(type).libelle(type.getLibelle()).build())));
    }

    private UserBadgeItem toItem(Badge badge) {
        TypeBadge t = badge.getType();
        return UserBadgeItem.builder()
                .badgeId(badge.getId())
                .libelle(badge.getLibelle())
                .typeLibelle(t != null ? t.getLibelle() : null)
                .typeDescription(t != null ? t.getDescription() : null)
                .build();
    }

    @Getter
    @Builder
    public static class UserBadgeItem {
        private final Long badgeId;
        private final String libelle;
        private final String typeLibelle;
        private final String typeDescription;
    }
}
