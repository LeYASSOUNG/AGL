package com.quicklodge.repository;

import com.quicklodge.entity.Badge;
import com.quicklodge.entity.TypeBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByType(TypeBadge type);

    Optional<Badge> findFirstByType_LibelleIgnoreCaseAndType_ActifTrue(String typeLibelle);
}
