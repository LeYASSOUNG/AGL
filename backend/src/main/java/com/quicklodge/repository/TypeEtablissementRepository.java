package com.quicklodge.repository;

import com.quicklodge.entity.TypeEtablissement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TypeEtablissementRepository extends JpaRepository<TypeEtablissement, Long> {
    List<TypeEtablissement> findByActifTrue();
}

