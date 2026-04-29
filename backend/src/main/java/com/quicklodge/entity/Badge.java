package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Badge de reconnaissance (ex. Super Hôte).
 * Relation ManyToMany avec User — table jointure user_badges.
 */
@Entity
@Table(name = "badges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_badge_id", nullable = false)
    private TypeBadge type;

    @Column(length = 100)
    private String libelle;

    /** ManyToMany : les users possédant ce badge. Côté inverse. */
    @ManyToMany(mappedBy = "badges", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> users = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
