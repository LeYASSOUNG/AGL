package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Fichier image associé à une chambre (chemin relatif sous le répertoire d'upload).
 */
@Entity
@Table(name = "chambre_photos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChambrePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chambre_id", nullable = false)
    private Chambre chambre;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
