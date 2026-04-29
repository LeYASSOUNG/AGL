package com.quicklodge.repository;

import com.quicklodge.entity.Reservation;
import com.quicklodge.entity.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    long countByClient_IdAndStatut(Long clientId, StatutReservation statut);

    List<Reservation> findByClientId(Long userId);

    List<Reservation> findByEtablissementId(Long etablissementId);

    List<Reservation> findByStatut(StatutReservation statut);

    List<Reservation> findByClientIdAndStatut(Long userId, StatutReservation statut);

    boolean existsByEtablissementId(Long etablissementId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r JOIN r.chambres c WHERE c.id = :chambreId")
    boolean existsAnyReservationForChambre(@Param("chambreId") Long chambreId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
            "JOIN r.chambres c WHERE c.id = :chambreId AND r.statut NOT IN ('ANNULEE', 'TERMINEE') " +
            "AND (r.dateDebut <= :dateFin AND r.dateFin >= :dateDebut)")
    boolean existsReservationActive(@Param("chambreId") Long chambreId,
                                    @Param("dateDebut") LocalDate dateDebut,
                                    @Param("dateFin") LocalDate dateFin);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
            "JOIN r.chambres c WHERE c.id = :chambreId AND r.statut NOT IN ('ANNULEE', 'TERMINEE') " +
            "AND r.id <> :excludeReservationId " +
            "AND (r.dateDebut <= :dateFin AND r.dateFin >= :dateDebut)")
    boolean existsReservationActiveExcluding(
            @Param("chambreId") Long chambreId,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin,
            @Param("excludeReservationId") Long excludeReservationId);
}
