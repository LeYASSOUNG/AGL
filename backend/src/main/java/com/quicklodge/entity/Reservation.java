package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Réservation : client + établissement + chambres + services optionnels + paiements.
 * Relations : ManyToOne User, ManyToOne Etablissement, ManyToMany Chambre, OneToMany lignes services, OneToMany Paiement.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "nombre_voyageurs")
    private Integer nombreVoyageurs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private StatutReservation statut = StatutReservation.EN_ATTENTE;

    @Column(name = "montant_total", precision = 12, scale = 2)
    private BigDecimal montantTotal;

    @Column(length = 500)
    private String commentaire;

    /** Relation 9 : ManyToOne User — client qui effectue la réservation. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User client;

    /** Relation 10 : ManyToOne Etablissement — FK directe pour simplifier les requêtes. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etablissement_id", nullable = false)
    private Etablissement etablissement;

    /** Relation 11 : ManyToMany Chambre — table jointure reservation_chambres (plusieurs chambres par résa). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "reservation_chambres",
            joinColumns = @JoinColumn(name = "reservation_id"),
            inverseJoinColumns = @JoinColumn(name = "chambre_id")
    )
    @Builder.Default
    private Set<Chambre> chambres = new HashSet<>();

    /** Relation 12 : services commandés avec quantité (table reservation_service_lines). */
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReservationServiceLine> serviceLines = new ArrayList<>();

    /** Relation 13 : OneToMany Paiement — une réservation génère un ou plusieurs paiements. Cascade ALL. */
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Paiement> paiements = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Renseigné lors d'une annulation (client ou hôte). */
    @Column(name = "motif_annulation", length = 500)
    private String motifAnnulation;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;
}
