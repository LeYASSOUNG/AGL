package com.quicklodge.util;

import com.quicklodge.exception.TokenExpiredException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static com.quicklodge.util.AppConstants.CLAIM_EMAIL;
import static com.quicklodge.util.AppConstants.CLAIM_ROLES;

/**
 * Génération et validation des JWT (access + refresh).
 * Encode les rôles dans le claim "roles" pour reconstruire les autorités côté filtre.
 *
 * Notes:
 * - Access token: short-lived, contains roles (authorization decisions without DB lookup).
 * - Refresh token: long-lived, stored server-side (DB) for revocation. It does NOT embed roles.
 */
@Component
@Slf4j
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token.expiration-ms}")
    private long accessExpirationMs;

    @Value("${jwt.refresh-token.expiration-ms}")
    private long refreshExpirationMs;

    @Value("${jwt.issuer}")
    private String issuer;

    private Key getSigningKey() {
        // HS256 requires a sufficiently long secret (>= 32 bytes recommended).
        // In production, keep this out of source control and rotate via env var.
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Génère un access token à partir des UserDetails (email + rôles).
     */
    public String generateAccessToken(UserDetails userDetails) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim(CLAIM_EMAIL, userDetails.getUsername())
                .claim(CLAIM_ROLES, roles)
                // Issuer is checked by clients/ops tools; it helps when multiple environments exist.
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Génère un refresh token (subject = email, pas de claim roles).
     */
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim(CLAIM_EMAIL, email)
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Vérifie signature et expiration. Lance TokenExpiredException si expiré.
     */
    public boolean validateToken(String token) {
        try {
            // parseClaimsJws validates signature AND expiration based on the signing key.
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token expiré");
        } catch (SignatureException | MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            log.debug("Token invalide: {}", e.getMessage());
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get(CLAIM_EMAIL, String.class);
    }

    /**
     * Extrait la liste des rôles du claim "roles" pour reconstruire les GrantedAuthority.
     */
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        List<?> roles = claims.get(CLAIM_ROLES, List.class);
        return roles == null ? List.of() : roles.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .collect(Collectors.toList());
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }
}
