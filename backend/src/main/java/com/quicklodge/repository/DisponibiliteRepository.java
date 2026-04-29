package com.quicklodge.repository;

import com.quicklodge.entity.Disponibilite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DisponibiliteRepository extends JpaRepository<Disponibilite, Long> {

    List<Disponibilite> findByChambreId(Long chambreId);

    List<Disponibilite> findByChambreIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
            Long chambreId, LocalDate dateFin, LocalDate dateDebut);
}
