package com.quicklodge.repository;

import com.quicklodge.entity.RefreshToken;
import com.quicklodge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteAllByUser(User user);

    void deleteAllByExpiresAtBefore(Instant cutoff);
}
