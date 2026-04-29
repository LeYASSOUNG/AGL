package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Service additionnel proposé dans un catalogue (petit-déjeuner, ménage, etc.).
 * Relation ManyToOne CatalogueService. ManyToMany avec Reservation (table reservation_services).
 */
@Entity
@Table(name = "services")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategorieService categorie;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_type", nullable = false, length = 20)
    @Builder.Default
    private ServicePricingType pricingType = ServicePricingType.PAID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ServiceAvailability disponibilite = ServiceAvailability.PERMANENT;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prix;

    @Column(name = "unite", length = 50)
    private String unite;

    @Column(name = "conditions_utilisation", length = 1000)
    private String conditionsUtilisation;

    /** Fichier relatif sous le répertoire d'upload, ex. {@code service-photos/12/uuid.jpg} */
    @Column(name = "image_storage_path", length = 500)
    private String imageStoragePath;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    /** ManyToOne CatalogueService : catalogue contenant ce service. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalogue_id", nullable = false)
    private CatalogueService catalogue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
