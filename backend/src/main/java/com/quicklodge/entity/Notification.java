package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Notification destinée à un utilisateur (réservation, paiement, avis, message, système).
 * Relation ManyToOne User (destinataire).
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_notification_id", nullable = false)
    private TypeNotification type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private StatutNotification statut = StatutNotification.NON_LU;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(length = 2000)
    private String contenu;

    @Column(name = "lien", length = 500)
    private String lien;

    @Column(name = "lu_at")
    private Instant luAt;

    /** Relation 17 : ManyToOne User — destinataire de la notification. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
