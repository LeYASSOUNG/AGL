package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Plage de disponibilité d'une chambre (dates ouvertes à la réservation).
 * Relation ManyToOne Chambre. Côté enfant.
 */
@Entity
@Table(name = "disponibilites")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Disponibilite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private StatutDisponibilite statut = StatutDisponibilite.OUVERTE;

    /** ManyToOne Chambre : chambre concernée. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chambre_id", nullable = false)
    private Chambre chambre;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
