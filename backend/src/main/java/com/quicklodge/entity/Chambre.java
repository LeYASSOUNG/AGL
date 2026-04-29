package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Chambre d'un établissement. Au moins une chambre par établissement.
 * Relation ManyToOne Etablissement. OneToMany Disponibilite.
 */
@Entity
@Table(name = "chambres")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chambre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Titre court / référence interne (max 100 car.), souvent dérivé du nom personnalisé.
     */
    @Column(nullable = false, length = 100)
    private String nom;

    /**
     * Nom affiché côté hôte / voyageur (style Booking.com). Nullable en BD pour compatibilité
     * des données existantes ; toujours renseigné pour les nouvelles chambres.
     */
    @Column(name = "nom_personnalise", length = 255)
    private String nomPersonnalise;

    /**
     * Type de chambre (configurable par l'admin).
     * ManyToOne : plusieurs chambres peuvent partager le même type.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_chambre_id", nullable = false)
    private TypeChambre typeChambre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private StatutChambre statut = StatutChambre.DISPONIBLE;

    @Column(name = "prix_nuit", nullable = false, precision = 10, scale = 2)
    private BigDecimal prixNuit;

    @Column(name = "capacite_personnes")
    private Integer capacitePersonnes;

    @Column(name = "surface_m2", precision = 6, scale = 2)
    private BigDecimal surfaceM2;

    /** ManyToOne Etablissement : établissement contenant la chambre. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etablissement_id", nullable = false)
    private Etablissement etablissement;

    /** Relation 8 : OneToMany Disponibilite — plages de disponibilité. Cascade ALL + orphanRemoval. */
    @OneToMany(mappedBy = "chambre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Disponibilite> disponibilites = new ArrayList<>();

    @OneToMany(mappedBy = "chambre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 32)
    @Builder.Default
    private List<ChambrePhoto> photos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
