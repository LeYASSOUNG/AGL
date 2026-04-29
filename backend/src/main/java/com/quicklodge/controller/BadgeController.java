package com.quicklodge.controller;

import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.BadgeService;
import com.quicklodge.service.BadgeService.UserBadgeItem;
import com.quicklodge.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Consultation des badges utilisateur (recalcul des règles automatiques à la lecture).
 */
@RestController
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    @GetMapping("/users/me/badges")
    public ResponseEntity<List<UserBadgeItem>> myBadges() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            throw new UnauthorizedException("Non authentifié");
        }
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable"))
                .getId();
        return ResponseEntity.ok(badgeService.listBadgesWithAutomaticRules(userId));
    }

    @GetMapping("/users/{userId}/badges")
    public ResponseEntity<List<UserBadgeItem>> badgesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.listBadgesWithAutomaticRules(userId));
    }

    /** Recalcul explicite (même effet que GET, utile pour déclencher après une action métier). */
    @PostMapping("/users/me/badges/sync")
    public ResponseEntity<List<UserBadgeItem>> syncMyBadges() {
        return myBadges();
    }
}
