package com.quicklodge.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Ligne de réservation pour un service du catalogue : quantité commandée (prix unitaire sur {@link Service}).
 * Remplace la simple table de jointure many-to-many afin de supporter quantités et futurs champs (créneau, date).
 */
@Entity
@Table(name = "reservation_service_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationServiceLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;
}
