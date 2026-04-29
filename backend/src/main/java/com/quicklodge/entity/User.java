package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Utilisateur unique (client et/ou hôte). Une seule table "users".
 * ROLE_CLIENT à l'inscription ; ROLE_HOST activé à la 1ère publication d'établissement.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /** Relation 1 : ManyToMany avec Role — table jointure user_roles. EAGER pour sécurité/affichage. */
    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /** Relation 2 : OneToMany RefreshToken — multi-device. Cascade ALL + orphanRemoval. */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    /** Relation 3 : ManyToMany avec Badge — table jointure user_badges. */
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "user_badges",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "badge_id")
    )
    @Builder.Default
    private Set<Badge> badges = new HashSet<>();

    /** Relation 4 : OneToMany Etablissement — l'utilisateur (hôte) gère plusieurs établissements. */
    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL, orphanRemoval = false, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Etablissement> etablissements = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ——— Helpers (pas de logique métier lourde) ———

    public void addRole(Role role) {
        roles.add(role);
        role.getUsers().add(this);
    }

    public boolean hasRole(ERole roleName) {
        return roles.stream().anyMatch(r -> r.getName() == roleName);
    }

    public boolean isHost() {
        return hasRole(ERole.ROLE_HOST);
    }

    /** Maintient les deux côtés de la relation ManyToMany User ↔ Badge (côté propriétaire : {@link #badges}). */
    public void addBadge(Badge badge) {
        badges.add(badge);
        badge.getUsers().add(this);
    }

    public void removeBadge(Badge badge) {
        badges.remove(badge);
        badge.getUsers().remove(this);
    }
}
