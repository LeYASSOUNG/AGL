package com.quicklodge.repository;

import com.quicklodge.entity.TypeChambre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TypeChambreRepository extends JpaRepository<TypeChambre, Long> {
    List<TypeChambre> findByActifTrue();
}

