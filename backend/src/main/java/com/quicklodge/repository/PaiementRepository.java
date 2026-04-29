package com.quicklodge.repository;

import com.quicklodge.entity.Paiement;
import com.quicklodge.entity.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByReservationId(Long reservationId);

    List<Paiement> findByStatut(StatutPaiement statut);
}
