package com.quicklodge.repository;

import com.quicklodge.entity.TypeBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TypeBadgeRepository extends JpaRepository<TypeBadge, Long> {

    List<TypeBadge> findByActifTrue();

    Optional<TypeBadge> findByLibelleIgnoreCase(String libelle);
}
