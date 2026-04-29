package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Fichier image associé à un établissement (chemin relatif sous le répertoire d'upload).
 */
@Entity
@Table(name = "etablissement_photos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtablissementPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etablissement_id", nullable = false)
    private Etablissement etablissement;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
