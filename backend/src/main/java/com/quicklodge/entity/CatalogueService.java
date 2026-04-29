package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Catalogue de services additionnels d'un établissement (0 ou 1 par établissement).
 * Relation OneToOne Etablissement (côté enfant, FK etablissement_id). OneToMany Service.
 */
@Entity
@Table(name = "catalogue_services")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogueService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String libelle;

    /** OneToOne Etablissement : propriétaire du catalogue. FK côté catalogue. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etablissement_id", unique = true)
    private Etablissement etablissement;

    /** Relation 7 : OneToMany Service — un catalogue contient plusieurs services. Cascade ALL + orphanRemoval. */
    @OneToMany(mappedBy = "catalogue", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Service> services = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
