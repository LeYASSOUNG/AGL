package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Établissement d'hébergement (hébergé par un user avec ROLE_HOST).
 * Relation ManyToOne User (propriétaire). OneToMany Chambre. OneToOne CatalogueService (optionnel).
 */
@Entity
@Table(name = "etablissements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Etablissement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Type d'établissement (configurable par l'admin).
     * ManyToOne : plusieurs établissements peuvent partager le même type.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_etablissement_id", nullable = false)
    private TypeEtablissement typeEtablissement;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 255)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Column(length = 20)
    private String codePostal;

    @Column(length = 100)
    private String pays;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    /** Nombre de favoris (cœurs) attribués par les utilisateurs. */
    @Column(name = "favoris_count", nullable = false)
    @Builder.Default
    private Integer favorisCount = 0;

    /**
     * Validation modération : les nouveaux hébergements sont invisibles sur la recherche publique
     * tant que l’admin n’a pas approuvé.
     */
    @Column(name = "valide_admin", nullable = false)
    @Builder.Default
    private Boolean valideAdmin = false;

    /** ManyToOne User : propriétaire (hôte). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User proprietaire;

    /** Relation 5 : OneToMany Chambre — au moins une chambre. Cascade ALL + orphanRemoval. */
    @OneToMany(mappedBy = "etablissement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 32)
    @Builder.Default
    private List<Chambre> chambres = new ArrayList<>();

    /** Relation 6 : OneToOne CatalogueService — 0 ou 1 catalogue. Optionnel. */
    @OneToOne(mappedBy = "etablissement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private CatalogueService catalogueService;

    @OneToMany(mappedBy = "etablissement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 32)
    @Builder.Default
    private List<EtablissementPhoto> photos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
