package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Avis posté après un séjour (réservation TERMINEE).
 * Relations : ManyToOne User (auteur), ManyToOne Etablissement, ManyToOne Reservation.
 */
@Entity
@Table(name = "avis")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Avis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer note;

    @Column(length = 2000)
    private String commentaire;

    @Column(name = "reponse_hote", length = 2000)
    private String reponseHote;

    @Column(name = "date_reponse")
    private Instant dateReponse;

    /** Relation 14 : ManyToOne User — auteur de l'avis. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    private User auteur;

    /** Relation 15 : ManyToOne Etablissement — établissement noté. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etablissement_id", nullable = false)
    private Etablissement etablissement;

    /** Relation 16 : ManyToOne Reservation — avis lié à un séjour terminé. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
